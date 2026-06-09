import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import api from '../api/client'

type PassType = 'TRIPS' | 'SUBSCRIPTION'
type TransportType = 'METRO' | 'GROUND' | 'ALL'
type PurchaseStatus = 'PENDING' | 'DONE' | 'FAILED'

interface Purchase {
  id: string
  passType: PassType
  transport: TransportType
  tripsAmount: number | null
  durationDays: number | null
  amount: string
  status: PurchaseStatus
  createdAt: string
  card: { cardNumber: string; alias: string | null }
}

const transportLabel: Record<TransportType, string> = { METRO: 'Metro', GROUND: 'Ground', ALL: 'All transport' }

const statusConfig: Record<PurchaseStatus, { label: string; class: string }> = {
  DONE:    { label: 'Done',    class: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  PENDING: { label: 'Pending', class: 'bg-amber-50 text-amber-600 border border-amber-100' },
  FAILED:  { label: 'Failed',  class: 'bg-red-50 text-red-500 border border-red-100' },
}

export const HistoryPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/purchase/history?page=${page}&limit=10`)
        setPurchases(data.data)
        setTotalPages(data.totalPages)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [page])

  return (
    <Layout>
      <div className="mb-8 fade-in">
        <h1 className="text-2xl font-bold text-slate-900">Purchase history</h1>
        <p className="text-slate-500 text-sm mt-1">All top-ups across your cards</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-20 fade-in">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-slate-100">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-slate-700 font-semibold">No purchases yet</p>
          <p className="text-slate-400 text-sm mt-1">Top up a card to see history here</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 fade-in">
            {purchases.map((p) => (
              <div key={p.id}
                className="bg-white border border-slate-200 rounded-2xl px-5 py-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {p.passType === 'TRIPS'
                        ? `${p.tripsAmount} trips · ${transportLabel[p.transport]}`
                        : `Subscription · ${transportLabel[p.transport]} · ${p.durationDays} days`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {p.card.alias ?? p.card.cardNumber} · {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm font-bold text-slate-800">{Number(p.amount).toFixed(2)} BYN</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusConfig[p.status].class}`}>
                      {statusConfig[p.status].label}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}