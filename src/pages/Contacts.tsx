import { useEffect, useState } from 'react'
import { Users, Search, MessageCircle, Send, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import Header from '../components/Header'
import type { Contact } from '../types'

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/contacts')
      .then(r => r.json())
      .then(d => { setContacts(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = contacts.filter(c =>
    c.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1">
      <Header
        title="Contatos"
        subtitle="Leads que interagiram com suas automações"
      />

      <div className="p-8">
        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Buscar por usuário ou nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="card p-4 flex items-center gap-4">
                <div className="skeleton w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <Users size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-gray-700 text-lg mb-2">
              {search ? 'Nenhum contato encontrado' : 'Nenhum contato ainda'}
            </h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {search
                ? 'Tente buscar com outro termo.'
                : 'Os leads que interagirem com suas automações aparecerão aqui.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 mb-3">{filtered.length} contatos</p>
            {filtered.map(contact => (
              <ContactRow
                key={contact.id}
                contact={contact}
                isExpanded={expanded === contact.id}
                onToggle={() => setExpanded(expanded === contact.id ? null : contact.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ContactRow({ contact: c, isExpanded, onToggle }: {
  contact: Contact
  isExpanded: boolean
  onToggle: () => void
}) {
  const initials = (c.name || c.username || '?').slice(0, 2).toUpperCase()

  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {c.profilePic ? (
            <img src={c.profilePic} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 text-sm">@{c.username}</p>
            {c.name && <p className="text-xs text-gray-400">{c.name}</p>}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={10} />
              {new Date(c.lastInteraction).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-xs text-gray-400">{c.totalInteractions} interaç{c.totalInteractions === 1 ? 'ão' : 'ões'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <MessageCircle size={12} className="text-sky-400" />
            {c.interactions.filter(i => i.replySent).length} comentários
          </span>
          <span className="flex items-center gap-1">
            <Send size={12} className="text-emerald-400" />
            {c.interactions.filter(i => i.dmSent).length} DMs
          </span>
        </div>

        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded interactions */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico de Interações</p>
          <div className="space-y-2">
            {c.interactions.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhuma interação registrada.</p>
            ) : (
              c.interactions.map(inter => (
                <div key={inter.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap size={12} className="text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-700">{inter.automationName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${inter.replySent ? 'bg-sky-50 text-sky-600' : 'bg-gray-100 text-gray-400'}`}>
                        {inter.replySent ? '✓ Comentário' : '✗ Comentário'}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${inter.dmSent ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {inter.dmSent ? '✓ DM' : '✗ DM'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 italic">"{inter.commentText}"</p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      {new Date(inter.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Zap({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
