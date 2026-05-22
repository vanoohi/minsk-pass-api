import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span
            className="font-bold text-lg tracking-tight cursor-pointer"
            onClick={() => navigate('/')}
          >
            MinskPass
          </span>
          <div className="flex items-center gap-4">
            <span className="text-blue-100 text-sm">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-md transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
