require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cron = require('node-cron')
const path = require('path')
const { getAll, getById, getSetting, setSetting, read } = require('./db')
const automationsRouter = require('./routes/automations')
const { router: instagramRouter, pollComments } = require('./routes/instagram')
const webhookRouter = require('./routes/webhook')
const privacyRouter = require('./routes/privacy')

const app = express()
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json())

app.use('/api/automations', automationsRouter)
app.use('/api/instagram', instagramRouter)
app.use('/api/webhook', webhookRouter)
app.use('/privacidade', privacyRouter)

// Settings
app.get('/api/settings', (req, res) => {
  res.json({
    accessToken: getSetting('accessToken') || '',
    instagramAccountId: getSetting('instagramAccountId') || '',
    igUsername: getSetting('igUsername') || '',
    pollingInterval: getSetting('pollingInterval') || 60,
    webhookVerifyToken: getSetting('webhookVerifyToken') || '',
    webhookConnected: Boolean(getSetting('webhookConnected')),
    tokenExpired: Boolean(getSetting('tokenExpired')),
    tokenExpiresAt: getSetting('tokenExpiresAt') || null,
  })
})

app.post('/api/settings', (req, res) => {
  const { accessToken, instagramAccountId, igUsername, pollingInterval, webhookVerifyToken } = req.body
  if (accessToken !== undefined) { setSetting('accessToken', accessToken); setSetting('tokenExpired', false) }
  if (instagramAccountId !== undefined) setSetting('instagramAccountId', instagramAccountId)
  if (igUsername !== undefined) setSetting('igUsername', igUsername)
  if (pollingInterval !== undefined) setSetting('pollingInterval', pollingInterval)
  if (webhookVerifyToken !== undefined) setSetting('webhookVerifyToken', webhookVerifyToken)
  startCron()
  res.json({ ok: true })
})

// Exchange short-lived token for long-lived (60 days)
app.post('/api/settings/exchange-token', async (req, res) => {
  const axios = require('axios')
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const token = getSetting('accessToken')

  if (!appId || !appSecret) return res.status(500).json({ error: 'Credenciais do app não configuradas no servidor.' })
  if (!token) return res.status(400).json({ error: 'Nenhum token salvo para trocar.' })

  try {
    const { data } = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: token,
      }
    })
    const longToken = data.access_token
    const expiresIn = data.expires_in // seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    setSetting('accessToken', longToken)
    setSetting('tokenExpired', false)
    setSetting('tokenExpiresAt', expiresAt)

    console.log(`[InstaFlow] Token trocado por longa duração — expira em ${expiresAt}`)
    res.json({ ok: true, expiresAt, expiresInDays: Math.floor(expiresIn / 86400) })
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message
    console.error('[InstaFlow] Erro ao trocar token:', msg)
    res.json({ ok: false, error: msg })
  }
})

// Dashboard
app.get('/api/dashboard', (req, res) => {
  const data = read()
  const automations = data.automations || []
  const interactions = (data.interactions || [])
    .sort((a, b) => b.timestamp?.localeCompare(a.timestamp))
    .slice(0, 20)

  const totalCommentsSent = automations.reduce((s, a) => s + (a.stats?.commentsSent || 0), 0)
  const totalDmsSent = automations.reduce((s, a) => s + (a.stats?.dmsSent || 0), 0)

  res.json({
    totalAutomations: automations.length,
    activeAutomations: automations.filter(a => a.active).length,
    totalContacts: (data.contacts || []).length,
    totalInteractions: (data.interactions || []).length,
    commentsSent: totalCommentsSent,
    dmsSent: totalDmsSent,
    recentActivity: interactions,
  })
})

// Contacts
app.get('/api/contacts', (req, res) => {
  const data = read()
  const contacts = (data.contacts || []).sort((a, b) => b.lastInteraction?.localeCompare(a.lastInteraction))
  const result = contacts.map(c => ({
    ...c,
    interactions: (data.interactions || []).filter(i => i.contactId === c.id)
      .sort((a, b) => b.timestamp?.localeCompare(a.timestamp))
  }))
  res.json(result)
})

// Default token pre-populated
const DEFAULT_TOKEN = 'EAAjSB2gET4kBRzaSKvUg4g6BI1FKhMkbOsK8rbB3wHZAV0LCS75B7ZAQvD3Ehp8qZArV2vvx6ze1wnAgxrMZCPGm6wlVISrqiRqTMjJeIr8MZCnvapq4SbBTyvdwwr6Q4Lh8sLNqtWDil1AweHJYgYph186uZAYpCphmTuM6eWP7Vv3TfM6XFMpdcuQ9DzB4sA47uCnwqfZBcMLdXG0H7bdZASYUWZBFEpvaKlnwLM7mYcrJUV03l5JqrXAmj9NGtyIDnrbmkxNYQcXQIZApHDw8EAZAtdzqSQTY5nXgHgZD'
if (!getSetting('accessToken')) {
  setSetting('accessToken', DEFAULT_TOKEN)
  setSetting('pollingInterval', 60)
  setSetting('webhookVerifyToken', 'instaflow_verify')
  console.log('[InstaFlow] Token pré-configurado.')
}

// Cron polling
let cronJob = null
function startCron() {
  if (cronJob) cronJob.stop()
  const interval = getSetting('pollingInterval') || 60
  const minutes = Math.max(1, Math.floor(interval / 60))
  const expr = `*/${minutes} * * * *`
  console.log(`[InstaFlow] Polling iniciado — a cada ${interval}s`)
  cronJob = cron.schedule(expr, () => {
    console.log('[InstaFlow] Verificando comentários...')
    pollComments().catch(console.error)
  })
}

startCron()

// Serve frontend in production
if (isProd) {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'))
    }
  })
}

app.listen(PORT, () => {
  console.log(`[InstaFlow] Backend rodando em http://localhost:${PORT}`)
  // Poll once on startup to test token
  setTimeout(() => {
    console.log('[InstaFlow] Poll inicial...')
    pollComments().catch(console.error)
  }, 2000)
})
