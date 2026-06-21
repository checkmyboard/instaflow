const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, 'data.json')

const defaultData = {
  settings: {},
  automations: [],
  contacts: [],
  interactions: [],
  processedComments: [],
}

function read() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
  } catch {
    return JSON.parse(JSON.stringify(defaultData))
  }
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8')
}

// Lazy init
if (!fs.existsSync(DB_PATH)) {
  write(defaultData)
}

const getSetting = (key) => {
  const data = read()
  return data.settings[key] ?? null
}

const setSetting = (key, value) => {
  const data = read()
  data.settings[key] = value
  write(data)
}

// Generic helpers
const getAll = (table) => read()[table] || []
const getById = (table, id) => (read()[table] || []).find(r => r.id === id)

const insert = (table, record) => {
  const data = read()
  if (!data[table]) data[table] = []
  data[table].push(record)
  write(data)
  return record
}

const update = (table, id, patch) => {
  const data = read()
  const idx = (data[table] || []).findIndex(r => r.id === id)
  if (idx === -1) return null
  data[table][idx] = { ...data[table][idx], ...patch }
  write(data)
  return data[table][idx]
}

const remove = (table, id) => {
  const data = read()
  data[table] = (data[table] || []).filter(r => r.id !== id)
  write(data)
}

const isProcessed = (commentId) => {
  const data = read()
  return (data.processedComments || []).includes(commentId)
}

const markProcessed = (commentId) => {
  const data = read()
  if (!data.processedComments) data.processedComments = []
  if (!data.processedComments.includes(commentId)) {
    data.processedComments.push(commentId)
    // Keep only last 5000
    if (data.processedComments.length > 5000) {
      data.processedComments = data.processedComments.slice(-5000)
    }
    write(data)
  }
}

module.exports = { read, write, getSetting, setSetting, getAll, getById, insert, update, remove, isProcessed, markProcessed }
