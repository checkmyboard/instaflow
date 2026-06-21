const express = require('express')
const { getSetting } = require('../db')
const { pollComments } = require('./instagram')

const router = express.Router()

// Webhook verification (GET)
router.get('/', (req, res) => {
  const verifyToken = getSetting('webhookVerifyToken') || 'instaflow_verify'
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Webhook] Verificado com sucesso')
    res.send(challenge)
  } else {
    res.status(403).send('Forbidden')
  }
})

// Webhook events (POST)
router.post('/', express.json(), (req, res) => {
  res.sendStatus(200)
  const body = req.body
  if (body.object !== 'instagram') return
  console.log('[Webhook] Evento recebido:', JSON.stringify(body).slice(0, 200))
  // Trigger a poll to process new comments
  pollComments().catch(console.error)
})

module.exports = router
