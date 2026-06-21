import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, Users, MessageCircle, Send, TrendingUp, ArrowUpRight,
  Activity, Clock, CheckCircle2, XCircle
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Header from '../components/Header'
import type { DashboardStats, Interaction } from '../types'

const mockChart = [
  { day: 'Seg', triggers: 4, dms: 3 },
  { day: 'Ter', triggers: 7, dms: 6 },
  { day: 'Qua', triggers: 5, dms: 5 },
  { day: 'Qui', triggers: 12, dms: 10 },
  { day: 'Sex', triggers: 9, dms: 8 },
  { day: 'Sáb', triggers: 15, dms: 13 },
  { day: 'Dom', triggers: 11, dms: 9 },
]

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const s = stats

  return (
    <div className="flex-1">
      <Header
        title="Dashboard"
        subtitle="Visão geral das suas automações"
        action={
          <Link to="/automations/new" className="btn-primary">
            <Zap size={16} />
            Nova Automação
          </Link>
        }
      />

      <div className="p-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon={<Zap className="w-5 h-5 text-primary-500" />}
            bg="bg-primary-50"
            label="Automações Ativas"
            value={loading ? '—' : String(s?.activeAutomations ?? 0)}
            sub={`de ${s?.totalAutomations ?? 0} total`}
            loading={loading}
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-violet-500" />}
            bg="bg-violet-50"
            label="Contatos"
            value={loading ? '—' : String(s?.totalContacts ?? 0)}
            sub="leads capturados"
            loading={loading}
          />
          <StatCard
            icon={<MessageCircle className="w-5 h-5 text-sky-500" />}
            bg="bg-sky-50"
            label="Comentários Enviados"
            value={loading ? '—' : String(s?.commentsSent ?? 0)}
            sub="respostas automáticas"
            loading={loading}
          />
          <StatCard
            icon={<Send className="w-5 h-5 text-emerald-500" />}
            bg="bg-emerald-50"
            label="DMs Enviadas"
            value={loading ? '—' : String(s?.dmsSent ?? 0)}
            sub="mensagens diretas"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="xl:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900">Atividade da Semana</h3>
                <p className="text-sm text-gray-500 mt-0.5">Gatilhos disparados e DMs enviadas</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-primary-500 rounded-full inline-block"/><span className="text-gray-500">Gatilhos</span></span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-500 rounded-full inline-block"/><span className="text-gray-500">DMs</span></span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mockChart}>
                <defs>
                  <linearGradient id="gTrig" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gDms" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  labelStyle={{ fontWeight: 600, color: '#111827' }}
                />
                <Area type="monotone" dataKey="triggers" stroke="#6366f1" strokeWidth={2} fill="url(#gTrig)" name="Gatilhos" />
                <Area type="monotone" dataKey="dms" stroke="#10b981" strokeWidth={2} fill="url(#gDms)" name="DMs" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Atividade Recente</h3>
              <Activity size={16} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="skeleton h-3 w-3/4" />
                      <div className="skeleton h-2.5 w-1/2" />
                    </div>
                  </div>
                ))
              ) : s?.recentActivity?.length ? (
                s.recentActivity.slice(0, 6).map((item: Interaction) => (
                  <ActivityItem key={item.id} item={item} />
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Nenhuma atividade ainda</p>
                  <p className="text-xs text-gray-300 mt-1">Configure uma automação para começar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            to="/automations/new"
            icon={<Zap size={20} className="text-primary-500" />}
            title="Criar Automação"
            desc="Configure palavra-chave, respostas e DM"
            color="from-primary-50 to-violet-50"
          />
          <QuickAction
            to="/posts"
            icon={<Activity size={20} className="text-sky-500" />}
            title="Ver Posts Monitorados"
            desc="Gerencie quais Reels estão ativos"
            color="from-sky-50 to-blue-50"
          />
          <QuickAction
            to="/contacts"
            icon={<Users size={20} className="text-emerald-500" />}
            title="Ver Contatos"
            desc="Leads que interagiram com suas automações"
            color="from-emerald-50 to-teal-50"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, bg, label, value, sub, loading }: {
  icon: React.ReactNode; bg: string; label: string; value: string; sub: string; loading: boolean
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>{icon}</div>
        <ArrowUpRight size={16} className="text-gray-300 mt-1" />
      </div>
      <div className="mt-3">
        {loading ? (
          <>
            <div className="skeleton h-7 w-16 mb-1" />
            <div className="skeleton h-3 w-24" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
          </>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 mt-2">{label}</p>
    </div>
  )
}

function ActivityItem({ item }: { item: Interaction }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.dmSent ? 'bg-emerald-50' : 'bg-primary-50'}`}>
        {item.dmSent ? <CheckCircle2 size={14} className="text-emerald-500" /> : <MessageCircle size={14} className="text-primary-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{item.automationName}</p>
        <p className="text-xs text-gray-400 truncate">"{item.commentText}"</p>
        <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
          <Clock size={10} />
          {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

function QuickAction({ to, icon, title, desc, color }: {
  to: string; icon: React.ReactNode; title: string; desc: string; color: string
}) {
  return (
    <Link to={to} className={`card p-5 bg-gradient-to-br ${color} hover:shadow-md transition-all duration-200 group`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">{icon}</div>
        <div>
          <p className="font-semibold text-gray-900 text-sm group-hover:text-primary-600 transition-colors">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
      </div>
    </Link>
  )
}
