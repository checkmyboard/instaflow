import { useEffect, useState, useCallback } from 'react'
import {
  Settings as SettingsIcon, Key, Clock, Webhook, CheckCircle2,
  AlertCircle, RefreshCw, Copy, Info, Instagram, Zap, CalendarClock
} from 'lucide-react'
import Header from '../components/Header'
import type { Settings } from '../types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    accessToken: '',
    instagramAccountId: '',
    igUsername: '',
    pollingInterval: 60,
    webhookVerifyToken: '',
    webhookConnected: false,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [tokenExpired, setTokenExpired] = useState(false)
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [exchanging, setExchanging] = useState(false)
  const [exchangeResult, setExchangeResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const loadSettings = useCallback(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setSettings(d)
        setTokenExpired(d.tokenExpired || false)
        setTokenExpiresAt(d.tokenExpiresAt || null)
        setTestResult(null)
        setExchangeResult(null)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  const save = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        loadSettings()
      } else {
        const d = await res.json()
        setError(d.error || 'Erro ao salvar.')
      }
    } finally {
      setSaving(false)
    }
  }

  const testToken = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      // Save the token first so the backend tests the current value
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: settings.accessToken })
      })
      const res = await fetch('/api/instagram/test')
      const d = await res.json()
      setTestResult(d)
      // Re-fetch to get what the backend actually saved
      if (d.ok) loadSettings()
    } finally {
      setTesting(false)
    }
  }

  const exchangeToken = async () => {
    setExchanging(true)
    setExchangeResult(null)
    try {
      const res = await fetch('/api/settings/exchange-token', { method: 'POST' })
      const d = await res.json()
      if (d.ok) {
        setExchangeResult({ ok: true, msg: `Token renovado! Válido por ${d.expiresInDays} dias (até ${new Date(d.expiresAt).toLocaleDateString('pt-BR')})` })
        loadSettings()
      } else {
        setExchangeResult({ ok: false, msg: d.error || 'Erro ao renovar token.' })
      }
    } finally {
      setExchanging(false)
    }
  }

  const getDaysUntilExpiry = () => {
    if (!tokenExpiresAt) return null
    const diff = new Date(tokenExpiresAt).getTime() - Date.now()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  const copyWebhook = () => {
    const url = `${window.location.origin}/api/webhook`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1">
      <Header
        title="Configurações"
        subtitle="Token de acesso, polling e webhook do Instagram"
        action={
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
            ) : saved ? (
              <><CheckCircle2 size={16} /> Salvo!</>
            ) : (
              <><SettingsIcon size={16} /> Salvar Configurações</>
            )}
          </button>
        }
      />

      <div className="p-8 max-w-3xl space-y-6">
        {tokenExpired && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Token Expirado — Automações pausadas!</p>
              <p className="text-sm text-red-600 mt-1">
                Gere um novo token em <strong>developers.facebook.com → seu app → Instagram → Gerar Token</strong> e cole abaixo.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Token */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
            <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
              <Key size={15} className="text-orange-500" />
            </div>
            <h3 className="font-bold text-gray-900">Token de Acesso — Meta Graph API</h3>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 flex gap-2">
            <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-semibold">Como obter o token:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-blue-600">
                <li>Acesse developers.facebook.com → Seu App (0makez)</li>
                <li>Menu esquerdo → Instagram → "1. Gere tokens de acesso"</li>
                <li>Clique em "Gerar token" ao lado de @melhoresabordagens</li>
                <li>Clique no botão "Copiar" no popup e cole abaixo</li>
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Access Token *</label>
              <textarea
                rows={3}
                className="input font-mono text-xs resize-none"
                value={settings.accessToken}
                onChange={e => setSettings(s => ({ ...s, accessToken: e.target.value }))}
                placeholder="Cole aqui o token (IGAA... ou EAA...)"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={testToken}
                disabled={testing || !settings.accessToken}
                className="btn-secondary"
              >
                {testing ? (
                  <><RefreshCw size={15} className="animate-spin" /> Testando...</>
                ) : (
                  <><Instagram size={15} /> Testar Conexão</>
                )}
              </button>

              {testResult && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                  testResult.ok
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {testResult.ok
                    ? <><CheckCircle2 size={15} /> {testResult.msg}</>
                    : <><AlertCircle size={15} /> {testResult.msg}</>
                  }
                </div>
              )}
            </div>

            {/* Token expiry + exchange */}
            {(() => {
              const days = getDaysUntilExpiry()
              const isWarning = days !== null && days <= 7 && days >= 0
              const isExpired = tokenExpired || (days !== null && days < 0)
              return (
                <div className={`rounded-xl p-4 border flex flex-col gap-3 ${
                  isExpired ? 'bg-red-50 border-red-200' :
                  isWarning ? 'bg-amber-50 border-amber-200' :
                  'bg-gray-50 border-gray-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <CalendarClock size={15} className={isExpired ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${isExpired ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-gray-600'}`}>
                      {isExpired
                        ? 'Token expirado — renove agora'
                        : days !== null
                          ? isWarning
                            ? `Token expira em ${days} dia${days !== 1 ? 's' : ''} — renove em breve!`
                            : `Token válido por mais ${days} dias (até ${new Date(tokenExpiresAt!).toLocaleDateString('pt-BR')})`
                          : 'Converta para token de 60 dias'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={exchangeToken}
                      disabled={exchanging || !settings.accessToken}
                      className={`btn-secondary text-xs py-1.5 ${isExpired || isWarning ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : ''}`}
                    >
                      {exchanging
                        ? <><RefreshCw size={13} className="animate-spin" /> Renovando...</>
                        : <><Zap size={13} /> Renovar para 60 dias</>}
                    </button>
                    {exchangeResult && (
                      <span className={`text-xs font-medium flex items-center gap-1 ${exchangeResult.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                        {exchangeResult.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        {exchangeResult.msg}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Troca o token atual por um de longa duração (60 dias). Clique sempre que gerar um token novo no Meta.
                  </p>
                </div>
              )
            })()}

            {/* Account info */}
            <div className="border-t border-gray-100 pt-4">
              <label className="label">Instagram Account ID</label>
              <input
                className="input font-mono text-xs"
                value={settings.instagramAccountId}
                onChange={e => setSettings(s => ({ ...s, instagramAccountId: e.target.value }))}
                placeholder="Ex: 17841400000000000"
              />
              <p className="text-xs text-gray-400 mt-1">Preenchido automaticamente ao testar. Encontre em: Instagram → Configurações → Conta → "Sobre esta conta"</p>
            </div>

            {settings.instagramAccountId && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Instagram size={15} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">@{settings.igUsername || 'sua_conta'}</p>
                    <p className="text-xs text-gray-400">ID: {settings.instagramAccountId}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                    tokenExpired
                      ? 'text-red-600 bg-red-50 border-red-100'
                      : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tokenExpired ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    {tokenExpired ? 'Token expirado' : 'Conectado'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Polling */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
            <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
              <Clock size={15} className="text-violet-500" />
            </div>
            <h3 className="font-bold text-gray-900">Monitoramento Automático</h3>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5 flex gap-2">
            <Info size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              O sistema verifica novos comentários a cada X segundos.
              Valores menores = mais rápido, mas consome mais limite da API. Recomendado: 60–120s.
            </p>
          </div>

          <div className="max-w-xs">
            <label className="label">Intervalo de verificação (segundos)</label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={30} max={300} step={30}
                value={settings.pollingInterval}
                onChange={e => setSettings(s => ({ ...s, pollingInterval: Number(e.target.value) }))}
                className="flex-1 accent-primary-500"
              />
              <span className="w-16 text-center text-sm font-bold text-gray-700 bg-gray-100 py-1.5 rounded-lg">
                {settings.pollingInterval}s
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>30s (rápido)</span>
              <span>300s (econômico)</span>
            </div>
          </div>
        </div>

        {/* DM Capability */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertCircle size={15} className="text-amber-500" />
            </div>
            <h3 className="font-bold text-gray-900">Habilitar Envio de DMs</h3>
            <span className="ml-auto text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-medium">Necessário</span>
          </div>

          <div className="space-y-4">
            <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4">
              <p className="text-sm font-bold text-emerald-800 mb-2">Opção 1 — Mais rápida (para testes)</p>
              <ol className="text-xs text-emerald-700 list-decimal list-inside space-y-1">
                <li>Acesse <strong>developers.facebook.com</strong> → Seu App</li>
                <li>Menu esquerdo → <strong>Funções</strong> → <strong>Testadores</strong></li>
                <li>Adicione o Instagram do lead de teste como Testador</li>
                <li>O testador aceita o convite → DMs funcionam para ele</li>
              </ol>
            </div>

            <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
              <p className="text-sm font-bold text-blue-800 mb-2">Opção 2 — Para produção (todos os usuários)</p>
              <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
                <li>Em <strong>developers.facebook.com</strong> → Seu App → <strong>Modo do App</strong></li>
                <li>Mude para <strong>Ativo (Live)</strong></li>
                <li>Vá em <strong>Revisão do App</strong> → solicite <code className="bg-blue-100 px-1 rounded">instagram_manage_messages</code> com Acesso Padrão</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Webhook */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
            <div className="w-7 h-7 bg-sky-50 rounded-lg flex items-center justify-center">
              <Webhook size={15} className="text-sky-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Webhook (Tempo Real)</h3>
            </div>
            <span className={settings.webhookConnected ? 'badge-active' : 'badge-inactive'}>
              <span className={`w-1.5 h-1.5 rounded-full ${settings.webhookConnected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {settings.webhookConnected ? 'Ativo' : 'Não configurado'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">URL do Webhook</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  className="input bg-gray-50 font-mono text-xs text-gray-500 flex-1"
                  value={`${typeof window !== 'undefined' ? window.location.origin.replace(':5173', ':3001') : 'https://seudominio.com'}/api/webhook`}
                />
                <button onClick={copyWebhook} className="btn-secondary px-3">
                  {copied ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Verify Token</label>
              <input
                className="input font-mono text-xs"
                value={settings.webhookVerifyToken}
                onChange={e => setSettings(s => ({ ...s, webhookVerifyToken: e.target.value }))}
                placeholder="Um token secreto que você define"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pb-8">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
            ) : saved ? (
              <><CheckCircle2 size={16} /> Configurações Salvas!</>
            ) : (
              <><SettingsIcon size={16} /> Salvar Configurações</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
