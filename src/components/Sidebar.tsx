import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Zap, Film, Users, Settings, ChevronRight,
  Instagram, Sparkles, Bot, AlertTriangle
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/automations', icon: Zap, label: 'Automações' },
  { to: '/posts', icon: Film, label: 'Posts & Reels' },
  { to: '/contacts', icon: Users, label: 'Contatos' },
]

export default function Sidebar() {
  const location = useLocation()
  const [igUsername, setIgUsername] = useState('')
  const [tokenExpired, setTokenExpired] = useState(false)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const load = () => {
      fetch('/api/settings')
        .then(r => r.json())
        .then(d => {
          setIgUsername(d.igUsername || '')
          setTokenExpired(d.tokenExpired || false)
          setConnected(Boolean(d.instagramAccountId && !d.tokenExpired))
        })
        .catch(() => {})
    }
    load()
    // Refresh every 30s to pick up token expiry changes
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside className="sidebar-gradient w-64 min-h-screen flex flex-col fixed left-0 top-0 z-30 shadow-2xl">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">InstaFlow</h1>
            <p className="text-white/40 text-xs mt-0.5">Automação Instagram</p>
          </div>
        </div>
      </div>

      {/* Instagram Badge */}
      <div className="mx-4 mt-4">
        <NavLink to="/settings" className="block">
          <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2.5 border transition-colors ${
            tokenExpired
              ? 'bg-red-500/10 border-red-400/30 hover:bg-red-500/20'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Instagram className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {igUsername ? `@${igUsername}` : 'Instagram'}
              </p>
              <p className={`text-xs truncate ${tokenExpired ? 'text-red-300' : 'text-white/40'}`}>
                {tokenExpired ? 'Token expirado!' : connected ? 'Graph API v21.0' : 'Configurar token'}
              </p>
            </div>
            {tokenExpired ? (
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            ) : (
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-400 pulse-dot' : 'bg-gray-500'}`} />
            )}
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-white/25 text-xs font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={14} className="text-white/50" />}
            </NavLink>
          )
        })}

        <div className="pt-4">
          <p className="text-white/25 text-xs font-semibold uppercase tracking-widest px-3 mb-3">Sistema</p>
          <NavLink
            to="/settings"
            className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            <Settings size={18} className="flex-shrink-0" />
            <span className="flex-1">Configurações</span>
            {tokenExpired && <AlertTriangle size={13} className="text-red-400" />}
            {!tokenExpired && location.pathname === '/settings' && <ChevronRight size={14} className="text-white/50" />}
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-2">
          <Sparkles size={14} className="text-violet-400" />
          <span className="text-white/30 text-xs">InstaFlow v1.0</span>
        </div>
      </div>
    </aside>
  )
}
