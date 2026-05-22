import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
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

const transportLabel: Record<string, string> = { METRO: 'Metro', GROUND: 'Ground', ALL: 'All transport' }

const PassInfo = ({ pass }: { pass: Pass | null }) => {
  if (!pass) return <p className="text-blue-200 text-sm">No active pass</p>

  const expired = pass.type === 'SUBSCRIPTION' && pass.expiresAt && new Date(pass.expiresAt) < new Date()
  if (expired) return <p className="text-red-300 text-sm">Subscription expired</p>

  if (pass.type === 'TRIPS') return (
    <div>
      <p className="text-white font-bold text-2xl leading-none">{pass.tripsLeft}</p>
      <p className="text-blue-200 text-xs mt-1">trips · {transportLabel[pass.transport]}</p>
    </div>
  )

  return (
    <div>
      <p className="text-white font-bold text-sm">Subscription</p>
      <p className="text-blue-200 text-xs mt-0.5">{transportLabel[pass.transport]} · until {new Date(pass.expiresAt!).toLocaleDateString('en-GB')}</p>
    </div>
  )
}

export const DashboardPage = () => {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [alias, setAlias] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const fetchCards = async () => {
    try {
      const { data } = await api.get('/cards')
      setCards(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCards() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/cards', { cardNumber, alias: alias || undefined })
      setCardNumber(''); setAlias(''); setShowForm(false)
      fetchCards()
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to add card')
    } finally {
      setSubmitting(false)
    }
  }

  const cardGradients = [
    'linear-gradient(135deg, #1d4ed8, #2563eb, #0ea5e9)',
    'linear-gradient(135deg, #1e40af, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #1e3a8a, #2563eb, #7c3aed)',
  ]

  return (
    <Layout>
      {/* Greeting */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900">
          Hello, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage your transit cards</p>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid gap-4">
          {[1,2].map(i => (
            <div key={i} className="h-40 rounded-3xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : cards.length === 0 && !showForm ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-blue-100">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="6" width="18" height="13" rx="2" stroke="#2563eb" strokeWidth="1.5"/>
              <path d="M3 10h18" stroke="#2563eb" strokeWidth="1.5"/>
            </svg>
          </div>
          <p className="text-slate-800 font-semibold text-lg">No cards yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-6">Add your transit card to get started</p>
          <button onClick={() => setShowForm(true)}
            className="text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            Add card
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card, i) => (
            <button key={card.id} onClick={() => navigate(`/cards/${card.id}`)}
              className="w-full text-left rounded-3xl p-6 shadow-lg shadow-blue-200/40 hover:shadow-xl hover:shadow-blue-300/40 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in relative overflow-hidden"
              style={{ background: cardGradients[i % cardGradients.length] }}>

              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2"
                  style={{ background: 'radial-gradient(circle, white, transparent)' }} />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-1/2 -translate-x-1/2"
                  style={{ background: 'radial-gradient(circle, white, transparent)' }} />
              </div>

              <div className="relative flex justify-between items-start">
                <div>
                  <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-1">Transit card</p>
                  <p className="text-white font-bold text-xl leading-tight">
                    {card.alias ?? `Card ${card.cardNumber}`}
                  </p>
                  <p className="text-blue-300 font-mono text-sm mt-1 tracking-wider">
                    {card.cardNumber.replace(/(\d{4})/g, '$1 ').trim()}
                  </p>
                </div>

                <div className="text-right">
                  <PassInfo pass={card.pass} />
                </div>
              </div>

              <div className="relative mt-4 flex justify-between items-end">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="w-6 h-4 rounded-sm bg-white/20" />
                  ))}
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/40">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          ))}

          {/* Add card button */}
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-blue-200 rounded-3xl p-6 text-blue-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200 flex items-center justify-center gap-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="font-medium text-sm">Add card</span>
            </button>
          )}
        </div>
      )}

      {/* Add card form */}
      {showForm && (
        <div className="mt-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm shadow-slate-100 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800">Add transit card</h3>
            <button onClick={() => { setShowForm(false); setError('') }}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Card number</label>
              <input type="text" value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="1234567890" required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Name <span className="text-slate-400 normal-case font-normal">(optional)</span>
              </label>
              <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)}
                placeholder="My card"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </p>
            )}
            <button type="submit" disabled={submitting}
              className="w-full text-white font-semibold py-3 rounded-xl disabled:opacity-60 transition-all"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              {submitting ? 'Adding...' : 'Add card'}
            </button>
          </form>
        </div>
      )}
    </Layout>
  )
}
