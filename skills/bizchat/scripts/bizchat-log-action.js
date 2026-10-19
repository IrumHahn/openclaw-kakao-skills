#!/usr/bin/env node
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const dbPath = process.env.BIZCHAT_DB_PATH || path.join(os.homedir(), '.openclaw', 'bizchat-qa.json')
const [action, id, ...rest] = process.argv.slice(2)
const allowed = new Set(['reply', 'ignore', 'resolve', 'note'])
if (!allowed.has(action) || !id) {
  console.error('Usage: node bizchat-log-action.js <reply|ignore|resolve|note> <chat-id> [text]')
  process.exit(1)
}
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
const matches = (db.chatHistory || []).filter(chat => chat.id === id)
if (matches.length !== 1) throw new Error(`Expected one chat ID; found ${matches.length}`)
const chat = matches[0]
const text = rest.join(' ').trim()
chat.actions ||= []
chat.actions.push({ action, text, at: new Date().toISOString() })
if (action !== 'note') chat.status = action === 'reply' ? 'replied' : action === 'ignore' ? 'ignored' : 'resolved'
const temp = `${dbPath}.${process.pid}.tmp`
fs.writeFileSync(temp, JSON.stringify(db, null, 2), { mode: 0o600 })
fs.renameSync(temp, dbPath)
console.log(JSON.stringify({ status: 'logged', action, id }))
