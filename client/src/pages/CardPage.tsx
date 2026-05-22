import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import api from '../api/client'

type PassType = 'TRIPS' | 'SUBSCRIPTION'
type TransportType = 'METRO' | 'GROUND' | 'ALL'

interface Pass {
  type: PassType
  transport: TransportType
  tripsLeft: number | null
  expiresAt: string | null
}

interface Purchase {
  id: string
  passType: PassType
  transport: TransportType
  tripsAmount: number | null
  durationDays: number | null
  amount: string
  status: 'PENDING' | 'DONE' | 'FAILED'
  createdAt: string
}

interface Card {
  id: string
  cardNumber: string
  alias: string | null
  pass: Pass | null
  purchases: Purchase[]
}

const transportLabel: Record<TransportType, string> = {
  METRO: 'Metro',
  GROUND: 'Ground transport',
  ALL: 'All transport',
}

const TRIP_PRICES: Record<TransportType, number> = { METRO: 0.9, GROUND: 0.8, ALL: 0.95 }
const SUB_PRICES: Record<TransportType, number> = { METRO: 35, GROUND: 30, ALL: 55 }

const PassStatus = ({ pass }: { pass: Pass | null }) => {
  if (!pass) return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-slate-400 text-sm">
      No active pass on this card
    </div>
  )

  const isExpired = pass.type === 'SUBSCRIPTION' && pass.expiresAt && new Date(pass.expiresAt) < new Date()

  return (
    <div className={`rounded-xl p-5 border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-blue-500 mb-1">Active pass</p>
      {pass.type === 'TRIPS' ? (
        <>
          <p className="text-2xl font-bold text-slate-800">{pass.tripsLeft} trips</p>
          <p className="text-sm text-slate-500 mt-0.5">{transportLabel[pass.transport]}</p>
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-slate-800">
            {isExpired ? 'Expired' : 'Subscription active'}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            {transportLabel[pass.transport]} · until {new Date(pass.expiresAt!).toLocaleDateString('en-GB')}
          </p>
        </>
      )}
    </div>
  )
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
  const [buyLoading, setBuyLoading] = useState(false)
  const [checkMsg, setCheckMsg] = useState('')

  const fetchCard = async () => {
    const { data } = await api.get(`/cards/${id}`)
    setCard(data)
    setLoading(false)
  }

  useEffect(() => { fetchCard() }, [id])

  const checkPurchase = async (type: PassType, tr: TransportType) => {
    try {
      const { data } = await api.get(`/cards/${id}/pass/check?type=${type}&transport=${tr}`)
      setCheckMsg(data.canBuy ? '' : data.reason)
    } catch {}
  }

  const handleTypeChange = (t: PassType) => {
    setPassType(t)
    checkPurchase(t, transport)
  }

  const handleTransportChange = (t: TransportType) => {
    setTransport(t)
    checkPurchase(passType, t)
  }

  const handleBuy = async () => {
    setBuyError('')
    setBuyLoading(true)
    try {
      const body: any = { cardId: id, passType, transport }
      if (passType === 'TRIPS') body.tripsAmount = tripsAmount
      else body.durationDays = durationDays

      await api.post('/purchase', body)
      setShowBuy(false)
      // В реальном проекте здесь был бы Stripe.js
      // Для демо показываем сообщение
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

  const statusColor: Record<string, string> = {
    DONE: 'text-green-600 bg-green-50',
    PENDING: 'text-yellow-600 bg-yellow-50',
    FAILED: 'text-red-600 bg-red-50',
  }

  if (loading) return <Layout><div className="text-center text-slate-400 py-16">Loading...</div></Layout>
  if (!card) return <Layout><div className="text-center text-slate-400 py-16">Card not found</div></Layout>

  return (
    <Layout>
      <button
        onClick={() => navigate('/')}
        className="text-sm text-blue-600 hover:underline mb-6 inline-flex items-center gap-1"
      >
        Back to cards
      </button>

      <div className="space-y-5">
        {/* Card header */}
        <div className="bg-blue-600 text-white rounded-2xl p-6">
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">Transit card</p>
          <p className="text-2xl font-bold">{card.alias ?? `Card ${card.cardNumber}`}</p>
          <p className="text-blue-200 font-mono text-sm mt-1">{card.cardNumber}</p>
        </div>

        {/* Pass status */}
        <PassStatus pass={card.pass} />

        {/* Buy button */}
        {!showBuy ? (
          <button
            onClick={() => { setShowBuy(true); checkPurchase(passType, transport) }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Top up card
          </button>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800">Choose pass type</h3>

            {/* Pass type */}
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Type</p>
              <div className="grid grid-cols-2 gap-2">
                {(['TRIPS', 'SUBSCRIPTION'] as PassType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      passType === t
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {t === 'TRIPS' ? 'Trips' : 'Subscription'}
                  </button>
                ))}
              </div>
            </div>

            {/* Transport */}
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Transport</p>
              <div className="grid grid-cols-3 gap-2">
                {(['METRO', 'GROUND', 'ALL'] as TransportType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTransportChange(t)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      transport === t
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {transportLabel[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            {passType === 'TRIPS' ? (
              <div>
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Number of trips</p>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 40].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTripsAmount(n)}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                        tripsAmount === n
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Duration</p>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDurationDays(d)}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                        durationDays === d
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </div>
            )}

            {checkMsg && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-3 py-2.5 rounded-lg">
                {checkMsg}
              </div>
            )}
            {buyError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg">
                {buyError}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <p className="text-slate-500 text-sm">Total: <span className="font-semibold text-slate-800">{price} BYN</span></p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowBuy(false); setBuyError(''); setCheckMsg('') }}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuy}
                  disabled={buyLoading || !!checkMsg}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {buyLoading ? 'Processing...' : `Pay ${price} BYN`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Purchase history */}
        {card.purchases.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-3">Purchase history</h3>
            <div className="space-y-2">
              {card.purchases.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {p.passType === 'TRIPS'
                        ? `${p.tripsAmount} trips · ${transportLabel[p.transport as TransportType]}`
                        : `Subscription · ${transportLabel[p.transport as TransportType]} · ${p.durationDays} days`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700">{Number(p.amount).toFixed(2)} BYN</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[p.status]}`}>
                      {p.status}
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
