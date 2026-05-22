import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import api from '../api/client'

type PassType = 'TRIPS' | 'SUBSCRIPTION'
type TransportType = 'METRO' | 'GROUND' | 'ALL'
type PurchaseStatus = 'PENDING' | 'DONE' | 'FAILED'

interface Pass { type: PassType; transport: TransportType; tripsLeft: number | null; expiresAt: string | null }
interface Purchase { id: string; passType: PassType; transport: TransportType; tripsAmount: number | null; durationDays: number | null; amount: string; status: PurchaseStatus; createdAt: string }
interface Card { id: string; cardNumber: string; alias: string | null; pass: Pass | null; purchases: Purchase[] }

const transportLabel: Record<TransportType, string> = { METRO: 'Metro', GROUND: 'Ground transport', ALL: 'All transport' }
const TRIP_PRICES: Record<TransportType, number> = { METRO: 0.9, GROUND: 0.8, ALL: 0.95 }
const SUB_PRICES: Record<TransportType, number> = { METRO: 35, GROUND: 30, ALL: 55 }

const SegmentButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick}
    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      active ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100'
    }`}
    style={active ? { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' } : {}}>
    {children}
  </button>
)

const statusConfig: Record<PurchaseStatus, { label: string; class: string }> = {
  DONE:    { label: 'Done',    class: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  PENDING: { label: 'Pending', class: 'bg-amber-50 text-amber-600 border border-amber-100' },
  FAILED:  { label: 'Failed',  class: 'bg-red-50 text-red-500 border border-red-100' },
}

export const CardPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBuy, setShowBuy] = useState(false)
  const [passType, setPassType] = useState<PassType>('TRIPS')
  const [transport, setTransport] = useState<TransportType>('METRO')
  const [tripsAmount, setTripsAmount] = useState(10)
  const [durationDays, setDurationDays] = useState(30)
  const [buyError, setBuyError] = useState('')
  const [checkMsg, setCheckMsg] = useState('')
  const [buyLoading, setBuyLoading] = useState(false)

  const fetchCard = async () => {
    const { data } = await api.get(`/cards/${id}`)
    setCard(data); setLoading(false)
  }

  useEffect(() => { fetchCard() }, [id])

  const check = async (type: PassType, tr: TransportType) => {
    try {
      const { data } = await api.get(`/cards/${id}/pass/check?type=${type}&transport=${tr}`)
      setCheckMsg(data.canBuy ? '' : data.reason)
    } catch {}
  }

  const handleBuy = async () => {
    setBuyError(''); setBuyLoading(true)
    try {
      const body: any = { cardId: id, passType, transport }
      if (passType === 'TRIPS') body.tripsAmount = tripsAmount
      else body.durationDays = durationDays
      await api.post('/purchase', body)
      setShowBuy(false)
      alert('Payment intent created. In production, Stripe payment form would appear here.')
      fetchCard()
    } catch (err: any) {
      setBuyError(err.response?.data?.error ?? 'Purchase failed')
    } finally {
      setBuyLoading(false)
    }
  }

  const price = passType === 'TRIPS'
    ? (TRIP_PRICES[transport] * tripsAmount).toFixed(2)
    : (SUB_PRICES[transport] * durationDays / 30).toFixed(2)

  if (loading) return (
    <Layout>
      <div className="h-48 rounded-3xl bg-slate-200 animate-pulse mb-4" />
      <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
    </Layout>
  )

  if (!card) return (
    <Layout>
      <p className="text-slate-400 text-center py-20">Card not found</p>
    </Layout>
  )

  const isExpired = card.pass?.type === 'SUBSCRIPTION' && card.pass.expiresAt && new Date(card.pass.expiresAt) < new Date()

  return (
    <Layout>
      <button onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      <div className="space-y-4 fade-in">
        {/* Card visual */}
        <div className="rounded-3xl p-7 text-white relative overflow-hidden shadow-xl shadow-blue-300/30"
          style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb, #0ea5e9)' }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full"
              style={{ background: 'radial-gradient(circle, white, transparent)' }} />
            <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full"
              style={{ background: 'radial-gradient(circle, white, transparent)' }} />
          </div>
          <div className="relative">
            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-4">MinskPass · Transit card</p>
            <p className="text-2xl font-bold mb-1">{card.alias ?? `Card ${card.cardNumber}`}</p>
            <p className="text-blue-300 font-mono text-sm tracking-wider">{card.cardNumber.replace(/(\d{4})/g, '$1 ').trim()}</p>
          </div>
        </div>

        {/* Pass status */}
        {card.pass && !isExpired ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Active pass</p>
            <div className="flex items-center justify-between">
              <div>
                {card.pass.type === 'TRIPS' ? (
                  <>
                    <p className="text-3xl font-bold text-slate-900">{card.pass.tripsLeft}</p>
                    <p className="text-slate-500 text-sm mt-0.5">trips remaining</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-slate-900">Subscription active</p>
                    <p className="text-slate-500 text-sm mt-0.5">
                      Until {new Date(card.pass.expiresAt!).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </>
                )}
              </div>
              <div className="text-right">
                <span className="inline-block bg-blue-50 text-blue-600 border border-blue-100 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {transportLabel[card.pass.transport]}
                </span>
              </div>
            </div>
            {card.pass.type === 'TRIPS' && card.pass.tripsLeft !== null && (
              <div className="mt-4">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      background: 'linear-gradient(90deg, #2563eb, #0ea5e9)',
                      width: `${Math.min(100, (card.pass.tripsLeft / 40) * 100)}%`
                    }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-5 text-center">
            <p className="text-slate-400 text-sm">{isExpired ? 'Subscription expired' : 'No active pass on this card'}</p>
          </div>
        )}

        {/* Top up button */}
        {!showBuy ? (
          <button onClick={() => { setShowBuy(true); check(passType, transport) }}
            className="w-full text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 hover:opacity-90 shadow-lg shadow-blue-200/50"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            Top up card
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Choose pass</h3>
              <button onClick={() => { setShowBuy(false); setBuyError(''); setCheckMsg('') }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Type</p>
              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                <SegmentButton active={passType === 'TRIPS'} onClick={() => { setPassType('TRIPS'); check('TRIPS', transport) }}>Trips</SegmentButton>
                <SegmentButton active={passType === 'SUBSCRIPTION'} onClick={() => { setPassType('SUBSCRIPTION'); check('SUBSCRIPTION', transport) }}>Subscription</SegmentButton>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Transport</p>
              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                {(['METRO', 'GROUND', 'ALL'] as TransportType[]).map(t => (
                  <SegmentButton key={t} active={transport === t} onClick={() => { setTransport(t); check(passType, t) }}>
                    {transportLabel[t].split(' ')[0]}
                  </SegmentButton>
                ))}
              </div>
            </div>

            {passType === 'TRIPS' ? (
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Trips</p>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 40].map(n => (
                    <button key={n} onClick={() => setTripsAmount(n)}
                      className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        tripsAmount === n ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Duration</p>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map(d => (
                    <button key={d} onClick={() => setDurationDays(d)}
                      className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        durationDays === d ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                      {d} days
                    </button>
                  ))}
                </div>
              </div>
            )}

            {checkMsg && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {checkMsg}
              </div>
            )}

            {buyError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{buyError}</div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-xl font-bold text-slate-900">{price} <span className="text-sm font-medium text-slate-500">BYN</span></p>
              </div>
              <button onClick={handleBuy} disabled={buyLoading || !!checkMsg}
                className="text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-blue-200/50"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                {buyLoading ? 'Processing...' : `Pay ${price} BYN`}
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {card.purchases.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-3 px-1">Purchase history</h3>
            <div className="space-y-2">
              {card.purchases.map((p) => (
                <div key={p.id}
                  className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-slate-300 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {p.passType === 'TRIPS'
                        ? `${p.tripsAmount} trips · ${transportLabel[p.transport as TransportType]}`
                        : `Subscription · ${transportLabel[p.transport as TransportType]} · ${p.durationDays} days`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">{Number(p.amount).toFixed(2)} BYN</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig[p.status].class}`}>
                      {statusConfig[p.status].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
