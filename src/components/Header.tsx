import { Bell, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  const [polling, setPolling] = useState(false)

  const triggerPoll = async () => {
    setPolling(true)
    try {
      await fetch('/api/instagram/poll', { method: 'POST' })
    } finally {
      setTimeout(() => setPolling(false), 1500)
    }
  }

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {action}
        <button
          onClick={triggerPoll}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          title="Sincronizar comentários agora"
        >
          <RefreshCw size={18} className={polling ? 'animate-spin text-primary-500' : ''} />
        </button>
        <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">IF</span>
        </div>
      </div>
    </header>
  )
}
