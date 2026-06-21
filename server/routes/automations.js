const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { getAll, getById, insert, update, remove } = require('../db')

const router = express.Router()

const toObj = (a) => a ? {
  id: a.id,
  name: a.name,
  active: a.active,
  keyword: a.keyword,
  matchType: a.matchType,
  postIds: a.postIds,
  commentReplies: a.commentReplies,
  dmMessage: a.dmMessage,
  likeCommentEnabled: a.likeCommentEnabled ?? false,
  replyToCommentEnabled: a.replyToCommentEnabled,
  sendDmEnabled: a.sendDmEnabled,
  requireFollower: a.requireFollower ?? false,
  nonFollowerReply: a.nonFollowerReply ?? '',
  createdAt: a.createdAt,
  stats: a.stats || { triggered: 0, commentsSent: 0, dmsSent: 0 }
} : null

router.get('/', (req, res) => {
  const rows = getAll('automations').sort((a, b) => b.createdAt?.localeCompare(a.createdAt))
  res.json(rows.map(toObj))
})

router.get('/:id', (req, res) => {
  const row = getById('automations', req.params.id)
  if (!row) return res.status(404).json({ error: 'Não encontrado' })
  res.json(toObj(row))
})

router.post('/', (req, res) => {
  const { name, keyword, matchType = 'contains', postIds = 'all', commentReplies = [], dmMessage = '', replyToCommentEnabled = true, sendDmEnabled = true, active = true } = req.body
  if (!name || !keyword) return res.status(400).json({ error: 'name e keyword são obrigatórios' })
  const { requireFollower = false, nonFollowerReply = '', dmMessages } = req.body
  // Support both dmMessage (legacy) and dmMessages (array)
  const resolvedDmMessages = dmMessages?.length ? dmMessages : (dmMessage ? [dmMessage] : [])
  const record = {
    id: uuidv4(),
    name, keyword, matchType, postIds, commentReplies,
    dmMessage: resolvedDmMessages[0] || '',
    dmMessages: resolvedDmMessages,
    likeCommentEnabled: req.body.likeCommentEnabled ?? false,
    replyToCommentEnabled, sendDmEnabled, requireFollower, nonFollowerReply, active,
    createdAt: new Date().toISOString(),
    stats: { triggered: 0, commentsSent: 0, dmsSent: 0 }
  }
  insert('automations', record)
  res.status(201).json(toObj(record))
})

router.put('/:id', (req, res) => {
  const existing = getById('automations', req.params.id)
  if (!existing) return res.status(404).json({ error: 'Não encontrado' })
  const { name, keyword, matchType, postIds, commentReplies, dmMessage, replyToCommentEnabled, sendDmEnabled, likeCommentEnabled, active } = req.body
  const { requireFollower, nonFollowerReply, dmMessages } = req.body
  const resolvedDmMessages = dmMessages?.length ? dmMessages : (dmMessage ? [dmMessage] : existing.dmMessages)
  const updated = update('automations', req.params.id, {
    name: name ?? existing.name,
    keyword: keyword ?? existing.keyword,
    matchType: matchType ?? existing.matchType,
    postIds: postIds ?? existing.postIds,
    commentReplies: commentReplies ?? existing.commentReplies,
    dmMessage: resolvedDmMessages?.[0] ?? existing.dmMessage,
    dmMessages: resolvedDmMessages ?? existing.dmMessages ?? [],
    likeCommentEnabled: likeCommentEnabled ?? existing.likeCommentEnabled ?? false,
    replyToCommentEnabled: replyToCommentEnabled ?? existing.replyToCommentEnabled,
    sendDmEnabled: sendDmEnabled ?? existing.sendDmEnabled,
    requireFollower: requireFollower ?? existing.requireFollower ?? false,
    nonFollowerReply: nonFollowerReply ?? existing.nonFollowerReply ?? '',
    active: active ?? existing.active,
  })
  res.json(toObj(updated))
})

router.patch('/:id', (req, res) => {
  const existing = getById('automations', req.params.id)
  if (!existing) return res.status(404).json({ error: 'Não encontrado' })
  const updated = update('automations', req.params.id, req.body)
  res.json(toObj(updated))
})

router.delete('/:id', (req, res) => {
  remove('automations', req.params.id)
  res.json({ ok: true })
})

module.exports = router
