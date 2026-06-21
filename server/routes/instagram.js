const express = require('express')
const axios = require('axios')
const { v4: uuidv4 } = require('uuid')
const { getSetting, getAll, getById, insert, update, isProcessed, markProcessed, read, write } = require('../db')

const router = express.Router()
const BASE = 'https://graph.facebook.com/v21.0'

const getToken = () => getSetting('accessToken') || ''
const getPageToken = () => getSetting('pageToken') || getToken()
const getAccountId = () => getSetting('instagramAccountId') || ''
const getPageId = () => getSetting('pageId') || ''

// Test connection — handles User Token (EAA), Page Token, or IG User Token (IGAA)
router.get('/test', async (req, res) => {
  const token = getToken()
  if (!token) return res.json({ ok: false, msg: 'Token não configurado' })

  const { setSetting } = require('../db')

  try {
    // IGAA tokens are Instagram User Access Tokens — query IG directly
    if (token.startsWith('IGAA') || token.startsWith('IGQ') || token.startsWith('EAA') === false) {
      try {
        const { data: igMe } = await axios.get(`${BASE}/me`, {
          params: { access_token: token, fields: 'id,username,name,followers_count' }
        })
        const accountId = igMe.id
        const username = igMe.username || igMe.name || `conta_${igMe.id.slice(-6)}`
        setSetting('instagramAccountId', accountId)
        setSetting('igUsername', username)
        setSetting('tokenExpired', false)
        return res.json({ ok: true, msg: `Conectado como @${username}`, accountId, username })
      } catch (e) {
        const msg = e.response?.data?.error?.message || e.message
        return res.json({ ok: false, msg: `Erro: ${msg}` })
      }
    }

    // EAA tokens: Facebook User Token — go through Pages → IG Business Account
    const { data: me } = await axios.get(`${BASE}/me`, {
      params: { access_token: token, fields: 'id,name' }
    })

    let accountId = null
    let username = null

    // Try via Pages → IG Business Account — also save Page Token
    try {
      const { data: pages } = await axios.get(`${BASE}/me/accounts`, {
        params: { access_token: token, fields: 'id,name,access_token,instagram_business_account' }
      })
      for (const page of pages.data || []) {
        if (page.instagram_business_account?.id) {
          accountId = page.instagram_business_account.id
          setSetting('pageToken', page.access_token)
          setSetting('pageId', page.id)
          try {
            const { data: igAcc } = await axios.get(`${BASE}/${accountId}`, {
              params: { access_token: page.access_token || token, fields: 'id,name,username' }
            })
            username = igAcc.username || igAcc.name
          } catch {}
          break
        }
      }
    } catch {}

    // Try /me/instagram_accounts (Creator)
    if (!accountId) {
      try {
        const { data: igAccs } = await axios.get(`${BASE}/me/instagram_accounts`, {
          params: { access_token: token, fields: 'id,username' }
        })
        if (igAccs.data?.length > 0) {
          accountId = igAccs.data[0].id
          username = igAccs.data[0].username
        }
      } catch {}
    }

    // Fallback: try saved accountId — verify it works with this token
    if (!accountId) {
      const saved = getAccountId()
      if (saved) {
        try {
          const { data: igAcc } = await axios.get(`${BASE}/${saved}`, {
            params: { access_token: token, fields: 'id,username,name' }
          })
          accountId = igAcc.id
          username = igAcc.username || igAcc.name
        } catch {}
      }
    }

    if (accountId) {
      setSetting('instagramAccountId', accountId)
      setSetting('igUsername', username || '')
      setSetting('tokenExpired', false)
      return res.json({ ok: true, msg: `Conectado como @${username || accountId}`, accountId, username })
    }

    // Could not find IG account — token works but no IG Business account linked
    return res.json({ ok: false, msg: `Token válido (${me.name}), mas nenhuma conta Instagram Business foi encontrada. Certifique-se de que sua conta IG está conectada a uma Página do Facebook no mesmo Business Manager.` })
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message
    res.json({ ok: false, msg: `Erro: ${msg}` })
  }
})

// Resolve the correct IG account ID from token
async function resolveIgAccountId(token) {
  // IGAA tokens are Instagram User Access Tokens — /me returns the IG account directly
  if (token && (token.startsWith('IGAA') || token.startsWith('IGQ'))) {
    const saved = getAccountId()
    if (saved) return { id: saved, type: 'saved', token }
    try {
      const { data: igMe } = await axios.get(`${BASE}/me`, {
        params: { access_token: token, fields: 'id,username' }
      })
      if (igMe.id) return { id: igMe.id, type: 'igaa', token }
    } catch {}
    return null
  }

  // EAA tokens: Try via Pages → IG Business Account
  try {
    const { data: pages } = await axios.get(`${BASE}/me/accounts`, {
      params: { access_token: token, fields: 'id,name,access_token,instagram_business_account' }
    })
    for (const page of pages.data || []) {
      if (page.instagram_business_account?.id) {
        const pageToken = page.access_token || token
        return { id: page.instagram_business_account.id, type: 'business', token: pageToken }
      }
    }
  } catch {}

  // Try /me/instagram_accounts (Creator accounts)
  try {
    const { data: igAccs } = await axios.get(`${BASE}/me/instagram_accounts`, {
      params: { access_token: token, fields: 'id,username' }
    })
    if (igAccs.data?.length > 0) {
      return { id: igAccs.data[0].id, type: 'creator', token }
    }
  } catch {}

  // Saved ID as last resort
  const saved = getAccountId()
  if (saved) return { id: saved, type: 'saved', token }

  return null
}

// Get posts
router.get('/posts', async (req, res) => {
  const token = getToken()
  if (!token) return res.json({ data: [], error: 'Token não configurado. Configure nas Configurações.' })

  const resolved = await resolveIgAccountId(token)
  if (!resolved) return res.json({ data: [], error: 'Conta Instagram Business/Creator não encontrada. Sua conta IG precisa estar conectada a uma Página do Facebook.' })

  try {
    const { data } = await axios.get(`${BASE}/${resolved.id}/media`, {
      params: {
        access_token: resolved.token || token,
        fields: 'id,media_type,media_url,thumbnail_url,caption,timestamp,like_count,comments_count,permalink',
        limit: 24
      }
    })
    // Save the correct ID if it worked
    if (resolved.id !== getAccountId()) {
      const { setSetting } = require('../db')
      setSetting('instagramAccountId', resolved.id)
    }
    res.json(data)
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message
    res.json({ data: [], error: `${msg}. Certifique-se de ter permissões: instagram_basic, instagram_manage_comments, instagram_manage_messages.` })
  }
})

async function getComments(mediaId, token) {
  try {
    const { data } = await axios.get(`${BASE}/${mediaId}/comments`, {
      params: { access_token: token, fields: 'id,text,username,timestamp,from', limit: 50 }
    })
    return data.data || []
  } catch (e) {
    const errCode = e.response?.data?.error?.code
    const errSub = e.response?.data?.error?.error_subcode
    const errMsg = e.response?.data?.error?.message || ''
    if (errCode === 190 || errSub === 463 || errSub === 467) {
      console.error('[InstaFlow] ⚠️  TOKEN EXPIRADO — acesse Configurações e gere um novo token em developers.facebook.com')
      const { setSetting } = require('../db')
      setSetting('tokenExpired', true)
    }
    return []
  }
}

async function likeComment(commentId, token) {
  try {
    await axios.post(`${BASE}/${commentId}/likes`, null, {
      params: { access_token: token }
    })
    console.log(`[InstaFlow] Curtiu comentário ${commentId}`)
    return true
  } catch (e) {
    console.error('[InstaFlow] Like error:', e.response?.data?.error?.message || e.message)
    return false
  }
}

async function replyToComment(commentId, message, token) {
  try {
    await axios.post(`${BASE}/${commentId}/replies`, null, {
      params: { access_token: token, message }
    })
    return true
  } catch (e) {
    console.error('[InstaFlow] Reply error:', e.response?.data?.error?.message || e.message)
    return false
  }
}

// Returns { sent: bool, notFollowing: bool, error: string }
async function sendDM(recipientId, message) {
  const token = getToken()
  const pageToken = getPageToken()
  const accountId = getAccountId()
  const pageId = getPageId()

  // Try 1: IG messages endpoint with page token (preferred)
  const tryEndpoint = async (accessToken, entityId) => {
    try {
      await axios.post(`${BASE}/${entityId}/messages`, {
        recipient: { id: recipientId },
        message: { text: message }
      }, { params: { access_token: accessToken } })
      return { sent: true }
    } catch (e) {
      const errMsg = e.response?.data?.error?.message || e.message || ''
      const errCode = e.response?.data?.error?.code
      const errSub = e.response?.data?.error?.error_subcode
      return { sent: false, code: errCode, subcode: errSub, msg: errMsg }
    }
  }

  // Attempt order: page token + IG ID → page token + Page ID → user token + IG ID
  const attempts = [
    pageToken && accountId ? [pageToken, accountId] : null,
    pageToken && pageId ? [pageToken, pageId] : null,
    token && accountId ? [token, accountId] : null,
  ].filter(Boolean)

  let lastErr = {}
  for (const [tk, eid] of attempts) {
    const result = await tryEndpoint(tk, eid)
    if (result.sent) {
      console.log(`[InstaFlow] DM enviada para ${recipientId} via ${eid}`)
      return { sent: true, notFollowing: false }
    }
    lastErr = result
    console.error(`[InstaFlow] DM error via ${eid} (code ${result.code}/${result.subcode}): ${result.msg}`)
  }

  // Classify the error
  const isFollowError = lastErr.code === 551 || lastErr.subcode === 2534048 ||
    (lastErr.msg || '').toLowerCase().includes('opted') ||
    (lastErr.msg || '').toLowerCase().includes('destinat') // "destinatário não tem função"

  const isAppModeError = lastErr.code === 3 || lastErr.code === 200

  if (isAppModeError) {
    console.error('[InstaFlow] ⚠️  App em modo Development — DMs só funcionam para Testers/Admins do app. Veja Configurações → Diagnóstico.')
  }

  return { sent: false, notFollowing: isFollowError, appModeError: isAppModeError, error: lastErr.msg }
}

function matchKeyword(text, keyword, matchType) {
  const t = (text || '').toLowerCase().trim()
  const k = (keyword || '').toLowerCase().trim()
  if (matchType === 'exact') return t === k
  if (matchType === 'startsWith') return t.startsWith(k)
  return t.includes(k)
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function upsertContact(userId, username, name) {
  const data = read()
  const existing = (data.contacts || []).find(c => c.id === userId)
  if (existing) {
    update('contacts', userId, {
      username: username || existing.username,
      name: name || existing.name,
      lastInteraction: new Date().toISOString(),
      totalInteractions: (existing.totalInteractions || 0) + 1
    })
  } else {
    insert('contacts', {
      id: userId,
      username: username || '',
      name: name || '',
      profilePic: null,
      firstSeen: new Date().toISOString(),
      lastInteraction: new Date().toISOString(),
      totalInteractions: 1
    })
  }
}

async function pollComments() {
  const token = getToken()
  const accountId = getAccountId()
  if (!token || !accountId) return

  const automations = getAll('automations').filter(a => a.active)
  if (!automations.length) return

  // Collect post IDs to check
  const postsToCheck = new Set()
  for (const auto of automations) {
    if (auto.postIds === 'all') {
      try {
        const { data } = await axios.get(`${BASE}/${accountId}/media`, {
          params: { access_token: token, fields: 'id', limit: 20 }
        })
        ;(data.data || []).forEach(p => postsToCheck.add(p.id))
      } catch {}
    } else if (Array.isArray(auto.postIds)) {
      auto.postIds.forEach(id => postsToCheck.add(id))
    }
  }

  for (const postId of postsToCheck) {
    const comments = await getComments(postId, token)

    for (const comment of comments) {
      const commentId = comment.id
      if (isProcessed(commentId)) continue
      markProcessed(commentId)

      const commentText = comment.text || ''
      const fromId = comment.from?.id || comment.username || ''
      const username = comment.username || comment.from?.username || ''

      for (const auto of automations) {
        if (!matchKeyword(commentText, auto.keyword, auto.matchType)) continue

        console.log(`[InstaFlow] Gatilho: "${auto.keyword}" | comentário: "${commentText}" | @${username}`)

        upsertContact(fromId, username, '')

        let replySent = false
        let dmSent = false

        if (auto.likeCommentEnabled) {
          await likeComment(commentId, token)
          await new Promise(r => setTimeout(r, 1500))
        }

        if (auto.replyToCommentEnabled) {
          const replies = auto.commentReplies || []
          if (replies.length > 0) {
            const reply = pickRandom(replies)
            replySent = await replyToComment(commentId, reply, token)
          }
        }

        if (auto.sendDmEnabled && fromId) {
          const dmVariations = (auto.dmMessages?.length ? auto.dmMessages : (auto.dmMessage ? [auto.dmMessage] : [])).filter(Boolean)
          let msg = dmVariations.length ? pickRandom(dmVariations) : ''
          msg = msg.replace(/\{\{nome\}\}/gi, username)
          const dmResult = await sendDM(fromId, msg)
          dmSent = dmResult.sent

          // Follower gate: se não segue e a opção está ativa, responde no comentário pedindo pra seguir
          if (!dmResult.sent && dmResult.notFollowing && auto.requireFollower && auto.nonFollowerReply) {
            const replyMsg = (auto.nonFollowerReply || '').replace(/\{\{nome\}\}/gi, username)
            console.log(`[InstaFlow] @${username} não segue a conta — aplicando follower gate`)
            await replyToComment(commentId, replyMsg, token)
          }
        }

        // Update stats
        const existing = getById('automations', auto.id)
        if (existing) {
          update('automations', auto.id, {
            stats: {
              triggered: (existing.stats?.triggered || 0) + 1,
              commentsSent: (existing.stats?.commentsSent || 0) + (replySent ? 1 : 0),
              dmsSent: (existing.stats?.dmsSent || 0) + (dmSent ? 1 : 0),
            }
          })
        }

        // Log interaction
        insert('interactions', {
          id: uuidv4(),
          contactId: fromId,
          automationId: auto.id,
          automationName: auto.name,
          postId,
          commentId,
          commentText,
          replySent,
          dmSent,
          timestamp: new Date().toISOString(),
        })

        break // First matching automation wins
      }
    }
  }
}

router.post('/poll', async (req, res) => {
  try {
    await pollComments()
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = { router, pollComments }
