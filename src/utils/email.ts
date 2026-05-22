import nodemailer from 'nodemailer'
import { TransportType, PassType } from '@prisma/client'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const transportLabel: Record<TransportType, string> = {
  METRO: 'метро',
  GROUND: 'наземный транспорт',
  ALL: 'все виды транспорта',
}

export const sendPurchaseSuccessEmail = async (
  to: string,
  cardNumber: string,
  passType: PassType,
  transport: TransportType,
  tripsAmount?: number,
  expiresAt?: Date,
): Promise<void> => {
  const what =
    passType === PassType.TRIPS
      ? `${tripsAmount} поездок (${transportLabel[transport]})`
      : `Абонемент (${transportLabel[transport]}) до ${expiresAt?.toLocaleDateString('ru-BY')}`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'MinskPass — Карта пополнена',
    html: `
      <h2>Карта пополнена ✅</h2>
      <p>Карта: <strong>${cardNumber}</strong></p>
      <p>Куплено: <strong>${what}</strong></p>
      <p>Спасибо за использование MinskPass!</p>
    `,
  })
}

export const sendPurchaseFailedEmail = async (
  to: string,
  cardNumber: string,
): Promise<void> => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'MinskPass — Платёж не прошёл',
    html: `
      <h2>Платёж не прошёл ❌</h2>
      <p>Карта: <strong>${cardNumber}</strong></p>
      <p>Деньги не были списаны. Попробуйте снова.</p>
    `,
  })
}
