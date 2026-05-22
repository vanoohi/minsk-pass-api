import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #eff6ff 0%, #f0f5ff 50%, #e0f2fe 100%)' }}>
      <header className="sticky top-0 z-50 border-b border-white/60"
        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2.5 font-bold text-blue-600 hover:text-blue-700 transition-colors">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <rect x="5" y="3" width="14" height="18" rx="2" stroke="white" strokeWidth="2.5"/>
                <path d="M9 8h6M9 12h6M9 16h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            MinskPass
          </button>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-slate-600 hidden sm:block">{user?.name}</span>
            <button onClick={handleLogout}
              className="text-xs font-medium text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
