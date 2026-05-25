import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <img
              src="/logo.png"
              alt="MinskPass"
              className="h-8 w-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className="text-lg">MinskPass</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/history')}
              title="Purchase history"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
<div className="w-px h-5 bg-slate-200 mx-1" />
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-blue-600"
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-slate-600 hidden sm:block">{user?.name}</span>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="text-sm text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
