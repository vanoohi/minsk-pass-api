import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import api from '../api/client'

interface Pass {
  type: 'TRIPS' | 'SUBSCRIPTION'
  transport: 'METRO' | 'GROUND' | 'ALL'
  tripsLeft: number | null
  expiresAt: string | null
}

interface Card {
  id: string
  cardNumber: string
  alias: string | null
  pass: Pass | null
}

const transportLabel: Record<string, string> = {
  METRO: 'Metro',
  GROUND: 'Ground',
  ALL: 'All transport',
}

const PassBadge = ({ pass }: { pass: Pass | null }) => {
  if (!pass) return (
    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">No pass</span>
  )

  if (pass.type === 'TRIPS') return (
    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
      {pass.tripsLeft} trips · {transportLabel[pass.transport]}
    </span>
  )

  const expired = pass.expiresAt && new Date(pass.expiresAt) < new Date()
  if (expired) return (
    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Subscription expired</span>
  )

  return (
    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
      Subscription · {transportLabel[pass.transport]} · until {new Date(pass.expiresAt!).toLocaleDateString('en-GB')}
    </span>
  )
}

export const DashboardPage = () => {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [alias, setAlias] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const fetchCards = async () => {
    const { data } = await api.get('/cards')
    setCards(data)
    setLoading(false)
  }

  useEffect(() => { fetchCards() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/cards', { cardNumber, alias: alias || undefined })
      setCardNumber('')
      setAlias('')
      setAdding(false)
      fetchCards()
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to add card')
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800">My cards</h2>
        <button
          onClick={() => setAdding(!adding)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {adding ? 'Cancel' : 'Add card'}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="font-medium text-slate-700 mb-4">Add transit card</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Card number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="1234567890"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Name (optional)</label>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="My card"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Add card
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-slate-400 py-16">Loading...</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">--</p>
          <p className="text-sm">No cards yet. Add your transit card to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => navigate(`/cards/${card.id}`)}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-800">
                    {card.alias ?? `Card ${card.cardNumber}`}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5 font-mono">{card.cardNumber}</p>
                </div>
                <PassBadge pass={card.pass} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
