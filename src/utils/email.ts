import { Resend } from 'resend'
import { TransportType, PassType } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)

const transportLabel: Record<TransportType, string> = {
  METRO: 'Metro',
  GROUND: 'Ground transport (bus, tram, trolleybus)',
  ALL: 'All transport types',
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
      ? `<strong>${tripsAmount} trips</strong> — ${transportLabel[transport]}`
      : `<strong>Subscription</strong> — ${transportLabel[transport]} until <strong>${expiresAt?.toLocaleDateString('en-GB')}</strong>`

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'MinskPass <onboarding@resend.dev>',
    to,
    subject: '✅ MinskPass — Card topped up',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Card topped up ✅</h2>
        <p>Card number: <strong>${cardNumber}</strong></p>
        <p>Purchased: ${what}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 14px;">Thank you for using MinskPass!</p>
      </div>
    `,
  })
}

export const sendPurchaseFailedEmail = async (
  to: string,
  cardNumber: string,
): Promise<void> => {
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'MinskPass <onboarding@resend.dev>',
    to,
    subject: '❌ MinskPass — Payment failed',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Payment failed ❌</h2>
        <p>Card number: <strong>${cardNumber}</strong></p>
        <p>Your payment could not be processed. No money was charged.</p>
        <p>Please try again.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 14px;">MinskPass Support</p>
      </div>
    `,
  })
}
