import { useState } from 'react'
import api from '../api/client'

type TransportType = 'METRO' | 'GROUND' | 'ALL'

const transportLabel: Record<TransportType, string> = { METRO: 'Metro', GROUND: 'Ground', ALL: 'All' }

type Result =
  | { ok: true; message: string; tripsLeft?: number; subscriptionExpiresAt?: string }
  | { ok: false; message: string }

export const ValidatePage = () => {
  const [cardNumber, setCardNumber] = useState('')
  const [transport, setTransport] = useState<TransportType>('METRO')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const { data } = await api.post('/validate', { cardNumber, transport })
      setResult({ ok: true, ...data })
    } catch (err: any) {
      setResult({ ok: false, message: err.response?.data?.error ?? 'Validation failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="6" width="18" height="13" rx="2" stroke="white" strokeWidth="1.8"/>
              <path d="M3 10h18" stroke="white" strokeWidth="1.8"/>
              <path d="M8 14h3" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Turnstile</h1>
          <p className="text-slate-500 text-sm mt-1">Simulate a transit gate tap</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <form onSubmit={handleValidate} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Card number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => { setCardNumber(e.target.value.replace(/\D/g, '')); setResult(null) }}
                placeholder="1234567890"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Transport</label>
              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                {(['METRO', 'GROUND', 'ALL'] as TransportType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTransport(t); setResult(null) }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      transport === t ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100'
                    }`}
                    style={transport === t ? { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' } : {}}>
                    {transportLabel[t]}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !cardNumber}
              className="w-full text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-blue-200/50"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              {loading ? 'Checking...' : 'Tap card'}
            </button>
          </form>

          {/* Result */}
          {result && (
            <div className={`rounded-2xl px-5 py-4 flex items-start gap-3 transition-all fade-in ${
              result.ok
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                result.ok ? 'bg-emerald-500' : 'bg-red-500'
              }`}>
                {result.ok ? (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <div>
                <p className={`font-semibold text-sm ${result.ok ? 'text-emerald-800' : 'text-red-700'}`}>
                  {result.ok ? 'Access granted' : 'Access denied'}
                </p>
                <p className={`text-xs mt-0.5 ${result.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                  {result.ok && result.tripsLeft !== undefined
                    ? `${result.tripsLeft} trips remaining`
                    : result.ok && result.subscriptionExpiresAt
                    ? `Subscription valid until ${new Date(result.subscriptionExpiresAt).toLocaleDateString('en-GB')}`
                    : result.message}
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          This is a demo turnstile — enter any registered card number
        </p>
      </div>
    </div>
  )
}
