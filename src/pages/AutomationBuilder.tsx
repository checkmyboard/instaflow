import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Zap, MessageCircle, Send,
  Hash, Film, Save, AlertCircle, CheckCircle2, Shuffle,
  Info, ChevronDown, UserCheck, Heart
} from 'lucide-react'
import type { Post, Automation } from '../types'

const matchOptions = [
  { value: 'contains', label: 'Contém a palavra' },
  { value: 'exact', label: 'Exatamente igual' },
  { value: 'startsWith', label: 'Começa com' },
]

export default function AutomationBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id && id !== 'new'

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  const [form, setForm] = useState({
    name: '',
    keyword: '',
    matchType: 'contains' as 'exact' | 'contains' | 'startsWith',
    postIds: 'all' as string[] | 'all',
    commentReplies: [''],
    dmMessages: [''],
    likeCommentEnabled: false,
    replyToCommentEnabled: true,
    sendDmEnabled: true,
    requireFollower: false,
    nonFollowerReply: '',
    active: true,
  })

  useEffect(() => {
    fetch('/api/instagram/posts')
      .then(r => r.json())
      .then(d => { setPosts(d.data || []); setLoadingPosts(false) })
      .catch(() => setLoadingPosts(false))

    if (isEdit) {
      fetch(`/api/automations/${id}`)
        .then(r => r.json())
        .then(d => {
          setForm({
            name: d.name,
            keyword: d.keyword,
            matchType: d.matchType,
            postIds: d.postIds,
            commentReplies: d.commentReplies,
            dmMessages: d.dmMessages?.length ? d.dmMessages : (d.dmMessage ? [d.dmMessage] : ['']),
            likeCommentEnabled: d.likeCommentEnabled ?? false,
            replyToCommentEnabled: d.replyToCommentEnabled,
            sendDmEnabled: d.sendDmEnabled,
            requireFollower: d.requireFollower ?? false,
            nonFollowerReply: d.nonFollowerReply ?? '',
            active: d.active,
          })
        })
    }
  }, [id, isEdit])

  const addReply = () => setForm(f => ({ ...f, commentReplies: [...f.commentReplies, ''] }))
  const removeReply = (i: number) =>
    setForm(f => ({ ...f, commentReplies: f.commentReplies.filter((_, idx) => idx !== i) }))
  const updateReply = (i: number, val: string) =>
    setForm(f => ({ ...f, commentReplies: f.commentReplies.map((r, idx) => idx === i ? val : r) }))

  const togglePost = (postId: string) => {
    if (form.postIds === 'all') {
      setForm(f => ({ ...f, postIds: [postId] }))
    } else {
      const arr = form.postIds as string[]
      if (arr.includes(postId)) {
        const next = arr.filter(p => p !== postId)
        setForm(f => ({ ...f, postIds: next.length === 0 ? 'all' : next }))
      } else {
        setForm(f => ({ ...f, postIds: [...arr, postId] }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Informe um nome para a automação.')
    if (!form.keyword.trim()) return setError('Informe a palavra-chave.')
    if (!form.replyToCommentEnabled && !form.sendDmEnabled)
      return setError('Ative pelo menos uma ação (comentário ou DM).')
    if (form.replyToCommentEnabled && form.commentReplies.every(r => !r.trim()))
      return setError('Adicione pelo menos uma variação de resposta.')
    if (form.sendDmEnabled && form.dmMessages.every(m => !m.trim()))
      return setError('Escreva pelo menos uma variação de mensagem para a DM.')

    setSaving(true)
    const url = isEdit ? `/api/automations/${id}` : '/api/automations'
    const method = isEdit ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          ...form,
          commentReplies: form.commentReplies.filter(r => r.trim()),
          dmMessages: form.dmMessages.filter(m => m.trim()),
        })
    })

    setSaving(false)
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => navigate('/automations'), 1200)
    } else {
      const d = await res.json()
      setError(d.error || 'Erro ao salvar.')
    }
  }

  return (
    <div className="flex-1 min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate('/automations')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Editar Automação' : 'Nova Automação'}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Configure gatilhos, respostas e mensagens automáticas</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button type="button" onClick={() => navigate('/automations')} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving || success} className="btn-primary">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
            ) : success ? (
              <><CheckCircle2 size={16} /> Salvo!</>
            ) : (
              <><Save size={16} /> {isEdit ? 'Salvar Alterações' : 'Criar Automação'}</>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1 — Basic Info */}
        <Section title="1. Informações Básicas" icon={<Zap size={16} className="text-primary-500" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome da Automação *</label>
              <input
                className="input"
                placeholder="Ex: Link na bio — Stories"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <div className="flex gap-3">
                {[true, false].map(val => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, active: val }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      form.active === val
                        ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {val ? '✓ Ativa' : '⏸ Pausada'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Step 2 — Trigger */}
        <Section title="2. Gatilho (Palavra-chave)" icon={<Hash size={16} className="text-violet-500" />}>
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-4 flex gap-2">
            <Info size={15} className="text-violet-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-violet-700">
              Quando alguém comentar com essa palavra-chave, a automação será disparada automaticamente.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Palavra-chave *</label>
              <input
                className="input font-mono"
                placeholder="Ex: link, quero, info, preço..."
                value={form.keyword}
                onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Tipo de correspondência</label>
              <div className="relative">
                <select
                  className="input appearance-none pr-8"
                  value={form.matchType}
                  onChange={e => setForm(f => ({ ...f, matchType: e.target.value as typeof form.matchType }))}
                >
                  {matchOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </Section>

        {/* Step 3 — Posts */}
        <Section title="3. Posts / Reels Monitorados" icon={<Film size={16} className="text-sky-500" />}>
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, postIds: 'all' }))}
              className={`mr-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                form.postIds === 'all'
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
              }`}
            >
              Todos os posts
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, postIds: [] }))}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                form.postIds !== 'all'
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
              }`}
            >
              Selecionar posts específicos
            </button>
          </div>

          {form.postIds !== 'all' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {loadingPosts ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="skeleton rounded-xl aspect-square" />
                ))
              ) : posts.length === 0 ? (
                <p className="text-sm text-gray-400 col-span-3">Nenhum post encontrado. Configure o token nas Configurações.</p>
              ) : (
                posts.map(post => {
                  const selected = (form.postIds as string[]).includes(post.id)
                  return (
                    <button
                      type="button"
                      key={post.id}
                      onClick={() => togglePost(post.id)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square bg-gray-100 ${
                        selected ? 'border-sky-500 shadow-md' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      {(post.thumbnail_url || post.media_url) && (
                        <img
                          src={post.thumbnail_url || post.media_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-end p-2">
                        <p className="text-white text-xs line-clamp-2 text-left">{post.caption?.slice(0, 50) || 'Sem legenda'}</p>
                      </div>
                      {selected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </Section>

        {/* Step 4 — Comment Reply */}
        <Section title="4. Resposta no Comentário" icon={<MessageCircle size={16} className="text-primary-500" />}>
          {/* Like toggle */}
          <div className="flex items-center gap-3 mb-3 p-3 bg-pink-50 border border-pink-100 rounded-xl">
            <Toggle
              checked={form.likeCommentEnabled}
              onChange={v => setForm(f => ({ ...f, likeCommentEnabled: v }))}
            />
            <Heart size={15} className={form.likeCommentEnabled ? 'text-pink-500' : 'text-gray-400'} />
            <span className="text-sm font-medium text-gray-700">
              {form.likeCommentEnabled ? 'Curtir o comentário antes de responder' : 'Não curtir o comentário'}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Toggle
              checked={form.replyToCommentEnabled}
              onChange={v => setForm(f => ({ ...f, replyToCommentEnabled: v }))}
            />
            <span className="text-sm font-medium text-gray-700">
              {form.replyToCommentEnabled ? 'Ativado — vai responder no post' : 'Desativado'}
            </span>
          </div>

          {form.replyToCommentEnabled && (
            <>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex gap-2">
                <Shuffle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Adicione várias variações — o sistema vai escolher uma aleatoriamente para cada resposta, evitando repetição.
                </p>
              </div>
              <div className="space-y-3">
                {form.commentReplies.map((reply, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0 mt-2.5">
                      {i + 1}
                    </div>
                    <textarea
                      className="input resize-none flex-1"
                      rows={2}
                      placeholder={`Variação ${i + 1} — Ex: Oi! Mandei o link no seu DM 😊`}
                      value={reply}
                      onChange={e => updateReply(i, e.target.value)}
                    />
                    {form.commentReplies.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeReply(i)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start mt-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addReply}
                  className="flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors mt-1 ml-8"
                >
                  <Plus size={15} />
                  Adicionar variação
                </button>
              </div>
            </>
          )}
        </Section>

        {/* Step 5 — DM */}
        <Section title="5. Mensagem Direta (DM)" icon={<Send size={16} className="text-emerald-500" />}>
          <div className="flex items-center gap-3 mb-4">
            <Toggle
              checked={form.sendDmEnabled}
              onChange={v => setForm(f => ({ ...f, sendDmEnabled: v }))}
            />
            <span className="text-sm font-medium text-gray-700">
              {form.sendDmEnabled ? 'Ativado — vai enviar DM automática' : 'Desativado'}
            </span>
          </div>

          {form.sendDmEnabled && (
            <>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4 flex gap-2">
                <Info size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700">
                  A DM é enviada logo após a resposta no comentário. Use <code className="bg-emerald-100 px-1 rounded">{'{{nome}}'}</code> para o nome do usuário. Adicione variações para evitar que o Instagram identifique como spam.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex gap-2">
                <Shuffle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  O sistema escolhe uma variação aleatória a cada DM enviada — mantenha o mesmo conteúdo com palavras diferentes.
                </p>
              </div>
              <div className="space-y-3">
                {form.dmMessages.map((msg, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs font-bold flex-shrink-0 mt-2.5">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <textarea
                        className="input resize-none"
                        rows={4}
                        placeholder={i === 0
                          ? `Oi {{nome}}! 👋\n\nVi que você perguntou sobre o link, aqui está:\n\n🔗 https://seulink.com\n\nQualquer dúvida é só chamar! 😊`
                          : `Variação ${i + 1} — mesma mensagem com palavras diferentes`}
                        value={msg}
                        onChange={e => setForm(f => ({ ...f, dmMessages: f.dmMessages.map((m, idx) => idx === i ? e.target.value : m) }))}
                      />
                      <p className="text-xs text-gray-400 mt-1">{msg.length} caracteres</p>
                    </div>
                    {form.dmMessages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, dmMessages: f.dmMessages.filter((_, idx) => idx !== i) }))}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start mt-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, dmMessages: [...f.dmMessages, ''] }))}
                  className="flex items-center gap-2 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors mt-1 ml-8"
                >
                  <Plus size={15} />
                  Adicionar variação de DM
                </button>
              </div>
            </>
          )}
        </Section>

        {/* Step 6 — Follower Gate */}
        <Section title="6. Verificação de Seguidor" icon={<UserCheck size={16} className="text-pink-500" />}>
          <div className="flex items-center gap-3 mb-4">
            <Toggle
              checked={form.requireFollower}
              onChange={v => setForm(f => ({ ...f, requireFollower: v }))}
            />
            <span className="text-sm font-medium text-gray-700">
              {form.requireFollower
                ? 'Ativado — exige que siga a conta para receber a DM'
                : 'Desativado — envia DM para todos'}
            </span>
          </div>

          {form.requireFollower && (
            <>
              <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 mb-4 flex gap-2">
                <Info size={14} className="text-pink-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-pink-700 space-y-1">
                  <p className="font-semibold">Como funciona:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Lead comenta com a palavra-chave</li>
                    <li>Bot tenta enviar a DM</li>
                    <li><strong>Se não segue:</strong> API retorna erro → bot responde no comentário com a mensagem abaixo pedindo pra seguir</li>
                    <li><strong>Se segue:</strong> DM enviada normalmente ✓</li>
                  </ol>
                </div>
              </div>

              {/* Flow visual */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-1">
                    <UserCheck size={18} className="text-pink-500" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Segue?</p>
                </div>
                <div className="flex flex-col gap-1 text-xs text-gray-400">
                  <span className="text-emerald-600 font-semibold">Sim →</span>
                  <span className="text-red-500 font-semibold">Não →</span>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-xs text-emerald-700 font-medium text-center">
                    ✓ Envia DM
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700 font-medium text-center">
                    ✗ Responde no comentário pedindo para seguir
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Resposta para quem não segue *</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder={`Ei! Para receber o conteúdo você precisa seguir nossa conta primeiro 👆\nSiga @melhoresabordagens, volte aqui e comente novamente! 😊`}
                  value={form.nonFollowerReply}
                  onChange={e => setForm(f => ({ ...f, nonFollowerReply: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Esta mensagem é postada como resposta no comentário quando o lead não segue a conta.
                </p>
              </div>
            </>
          )}
        </Section>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2 pb-8">
          <button type="button" onClick={() => navigate('/automations')} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving || success} className="btn-primary">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
            ) : success ? (
              <><CheckCircle2 size={16} /> Salvo com sucesso!</>
            ) : (
              <><Save size={16} /> {isEdit ? 'Salvar Alterações' : 'Criar Automação'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
        <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center">{icon}</div>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center ${
        checked ? 'bg-primary-500' : 'bg-gray-200'
      }`}
    >
      <span className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`} />
    </button>
  )
}
