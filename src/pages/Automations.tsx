import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, Plus, ToggleLeft, ToggleRight, Trash2, Edit2,
  MessageCircle, Send, Hash, ChevronRight, AlertCircle, UserCheck
} from 'lucide-react'
import Header from '../components/Header'
import type { Automation } from '../types'

export default function Automations() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = () => {
    fetch('/api/automations')
      .then(r => r.json())
      .then(d => { setAutomations(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggle = async (id: string, active: boolean) => {
    await fetch(`/api/automations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active })
    })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta automação?')) return
    setDeletingId(id)
    await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    load()
    setDeletingId(null)
  }

  return (
    <div className="flex-1">
      <Header
        title="Automações"
        subtitle="Gerencie seus gatilhos automáticos de comentário e DM"
        action={
          <Link to="/automations/new" className="btn-primary">
            <Plus size={16} />
            Nova Automação
          </Link>
        }
      />

      <div className="p-8">
        {loading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="card p-6">
                <div className="space-y-3">
                  <div className="skeleton h-5 w-48" />
                  <div className="skeleton h-4 w-32" />
                  <div className="flex gap-6 mt-4">
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : automations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {automations.map(auto => (
              <AutomationCard
                key={auto.id}
                automation={auto}
                onToggle={() => toggle(auto.id, auto.active)}
                onDelete={() => remove(auto.id)}
                deleting={deletingId === auto.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AutomationCard({ automation: a, onToggle, onDelete, deleting }: {
  automation: Automation
  onToggle: () => void
  onDelete: () => void
  deleting: boolean
}) {
  return (
    <div className={`card p-6 automation-card ${deleting ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${a.active ? 'bg-primary-50' : 'bg-gray-100'}`}>
          <Zap size={20} className={a.active ? 'text-primary-500' : 'text-gray-400'} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-bold text-gray-900 text-base">{a.name}</h3>
            <span className={a.active ? 'badge-active' : 'badge-inactive'}>
              <span className={`w-1.5 h-1.5 rounded-full ${a.active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {a.active ? 'Ativa' : 'Pausada'}
            </span>
          </div>

          {/* Keyword */}
          <div className="flex items-center gap-1.5 mt-2">
            <Hash size={13} className="text-gray-400" />
            <span className="text-sm text-gray-500">
              Palavra-chave:{' '}
              <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md text-xs">
                {a.keyword}
              </span>
            </span>
            <span className="text-xs text-gray-400 ml-1">
              ({a.matchType === 'exact' ? 'exata' : a.matchType === 'contains' ? 'contém' : 'começa com'})
            </span>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-5 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Zap size={12} className="text-primary-400" />
              <strong className="text-gray-700">{a.stats.triggered}</strong> gatilhos
            </span>
            {a.replyToCommentEnabled && (
              <span className="flex items-center gap-1.5">
                <MessageCircle size={12} className="text-sky-400" />
                <strong className="text-gray-700">{a.stats.commentsSent}</strong> comentários
              </span>
            )}
            {a.sendDmEnabled && (
              <span className="flex items-center gap-1.5">
                <Send size={12} className="text-emerald-400" />
                <strong className="text-gray-700">{a.stats.dmsSent}</strong> DMs
              </span>
            )}
            <span className="flex items-center gap-1.5 text-gray-400">
              Posts: {a.postIds === 'all' ? 'Todos' : `${(a.postIds as string[]).length} selecionados`}
            </span>
          </div>

          {/* Actions chips */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {a.replyToCommentEnabled && (
              <span className="text-xs bg-sky-50 text-sky-600 border border-sky-100 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <MessageCircle size={10} /> Resposta no post
              </span>
            )}
            {a.sendDmEnabled && (
              <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <Send size={10} /> Enviar DM
              </span>
            )}
            <span className="text-xs bg-gray-50 text-gray-500 border border-gray-100 px-2.5 py-1 rounded-full font-medium">
              {a.commentReplies.length} var. comentário
            </span>
            {a.sendDmEnabled && (
              <span className="text-xs bg-gray-50 text-gray-500 border border-gray-100 px-2.5 py-1 rounded-full font-medium">
                {(a.dmMessages?.length || 1)} var. DM
              </span>
            )}
            {a.requireFollower && (
              <span className="text-xs bg-pink-50 text-pink-600 border border-pink-100 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <UserCheck size={10} /> Exige seguidor
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg transition-colors ${a.active ? 'text-primary-500 hover:bg-primary-50' : 'text-gray-400 hover:bg-gray-100'}`}
            title={a.active ? 'Pausar' : 'Ativar'}
          >
            {a.active
              ? <ToggleRight size={26} />
              : <ToggleLeft size={26} />
            }
          </button>
          <Link
            to={`/automations/${a.id}/edit`}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Edit2 size={16} />
          </Link>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card p-16 text-center">
      <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Zap size={36} className="text-primary-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma automação criada</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6 text-sm leading-relaxed">
        Crie sua primeira automação para responder automaticamente comentários com palavras-chave
        e enviar DMs para seus leads no Instagram.
      </p>
      <Link to="/automations/new" className="btn-primary inline-flex mx-auto">
        <Plus size={16} />
        Criar Primeira Automação
      </Link>

      <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto">
        {[
          { icon: Hash, label: 'Palavra-chave detectada' },
          { icon: MessageCircle, label: 'Comentário automático' },
          { icon: Send, label: 'DM enviada' },
        ].map(({ icon: Icon, label }, i) => (
          <div key={i} className="flex flex-col items-center gap-2 relative">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Icon size={18} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 text-center">{label}</p>
            {i < 2 && <ChevronRight size={16} className="text-gray-200 absolute -right-5 top-3" />}
          </div>
        ))}
      </div>
    </div>
  )
}
