import { PassType, TransportType, PurchaseStatus } from '@prisma/client'
import prisma from '../../config/database'
import stripe from '../../config/stripe'
import { AppError } from '../../middleware/error.middleware'
import { checkCanPurchase } from '../pass/pass.service'
import { sendPurchaseSuccessEmail, sendPurchaseFailedEmail } from '../../utils/email'
import { CreatePurchaseDtoType } from './purchase.dto'

// Цены в BYN (копейки для Stripe)
const PRICES: Record<PassType, Record<TransportType, number>> = {
  [PassType.TRIPS]: {
    [TransportType.METRO]: 90,    // 0.90 BYN за поездку
    [TransportType.GROUND]: 80,
    [TransportType.ALL]: 95,
  },
  [PassType.SUBSCRIPTION]: {
    [TransportType.METRO]: 3500,  // 35.00 BYN/мес
    [TransportType.GROUND]: 3000,
    [TransportType.ALL]: 5500,
  },
}

const calculateAmount = (dto: CreatePurchaseDtoType): number => {
  const pricePerUnit = PRICES[dto.passType][dto.transport]
  if (dto.passType === PassType.TRIPS) {
    return pricePerUnit * dto.tripsAmount
  }
  // абонемент: цена за 30 дней * количество месяцев
  return Math.round((pricePerUnit * dto.durationDays) / 30)
}

export const createPurchase = async (userId: string, dto: CreatePurchaseDtoType) => {
  // 1. Проверяем что карта принадлежит юзеру
  const card = await prisma.card.findFirst({
    where: { id: dto.cardId, userId },
    include: { user: true },
  })
  if (!card) throw new AppError(404, 'Card not found')

  // 2. Проверяем можно ли покупать
  const check = await checkCanPurchase(userId, dto.cardId, dto.passType, dto.transport)
  if (!check.canBuy) throw new AppError(403, check.reason!)

  // 3. Считаем сумму
  const amountKopecks = calculateAmount(dto)
  const amountByn = amountKopecks / 100

  // 4. Создаём запись в БД
  const purchase = await prisma.purchase.create({
    data: {
      cardId: dto.cardId,
      passType: dto.passType,
      transport: dto.transport,
      tripsAmount: dto.passType === PassType.TRIPS ? dto.tripsAmount : null,
      durationDays: dto.passType === PassType.SUBSCRIPTION ? dto.durationDays : null,
      amount: amountByn,
      status: PurchaseStatus.PENDING,
    },
  })

  // 5. Создаём Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountKopecks,
    currency: 'byn',
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
    metadata: {
      purchaseId: purchase.id,
      cardId: dto.cardId,
      userId,
    },
  })

  // 6. Сохраняем stripeId
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { stripeId: paymentIntent.id },
  })

  return {
    purchaseId: purchase.id,
    amount: amountByn,
    clientSecret: paymentIntent.client_secret,
  }
}

export const handleStripeWebhook = async (
  payload: Buffer,
  signature: string,
): Promise<void> => {
  let event

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    throw new AppError(400, 'Invalid webhook signature')
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    await onPaymentSuccess(
      paymentIntent.id,
      paymentIntent.metadata as { purchaseId: string; cardId: string; userId: string },
    )
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object
    await onPaymentFailed(paymentIntent.id)
  }
}

const onPaymentSuccess = async (
  stripeId: string,
  metadata: { purchaseId: string; cardId: string; userId: string },
) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: metadata.purchaseId },
    include: { card: { include: { user: true } } },
  })

  if (!purchase || purchase.status !== PurchaseStatus.PENDING) return

  await prisma.$transaction(async (tx) => {
    // Обновляем статус покупки
    await tx.purchase.update({
      where: { id: purchase.id },
      data: { status: PurchaseStatus.DONE },
    })

    // Удаляем старый проездной если есть
    await tx.pass.deleteMany({ where: { cardId: purchase.cardId } })

    // Создаём новый проездной
    const expiresAt =
      purchase.passType === PassType.SUBSCRIPTION
        ? new Date(Date.now() + (purchase.durationDays ?? 30) * 24 * 60 * 60 * 1000)
        : null

    await tx.pass.create({
      data: {
        cardId: purchase.cardId,
        type: purchase.passType,
        transport: purchase.transport,
        tripsLeft: purchase.passType === PassType.TRIPS ? purchase.tripsAmount : null,
        expiresAt,
      },
    })
  })

  // Отправляем email
  await sendPurchaseSuccessEmail(
    purchase.card.user.email,
    purchase.card.cardNumber,
    purchase.passType,
    purchase.transport,
    purchase.tripsAmount ?? undefined,
    purchase.passType === PassType.SUBSCRIPTION
      ? new Date(Date.now() + (purchase.durationDays ?? 30) * 24 * 60 * 60 * 1000)
      : undefined,
  )
}

const onPaymentFailed = async (stripeId: string) => {
  const purchase = await prisma.purchase.findFirst({
    where: { stripeId },
    include: { card: { include: { user: true } } },
  })

  if (!purchase) return

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { status: PurchaseStatus.FAILED },
  })

  await sendPurchaseFailedEmail(purchase.card.user.email, purchase.card.cardNumber)
}

export const getPurchaseHistory = async (userId: string, cardId?: string) => {
  return prisma.purchase.findMany({
    where: {
      card: { userId },
      ...(cardId ? { cardId } : {}),
    },
    include: { card: { select: { cardNumber: true, alias: true } } },
    orderBy: { createdAt: 'desc' },
  })
}
