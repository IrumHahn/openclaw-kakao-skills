#!/usr/bin/env node
// Read-only Kakao Business chat-list monitor. No chat item is clicked.
const { chromium } = require('playwright')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')

const dbPath = process.env.BIZCHAT_DB_PATH || path.join(os.homedir(), '.openclaw', 'bizchat-qa.json')
const cdpUrl = process.env.BIZCHAT_CDP_URL || 'http://127.0.0.1:9222'
const hash = value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16)

function readDb() {
  if (!fs.existsSync(dbPath)) return { chatHistory: [], monitorStatus: {} }
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
}
function writeDb(db) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true, mode: 0o700 })
  const temp = `${dbPath}.${process.pid}.tmp`
  fs.writeFileSync(temp, JSON.stringify(db, null, 2), { mode: 0o600 })
  fs.renameSync(temp, dbPath)
}

async function main() {
  const browser = await chromium.connectOverCDP(cdpUrl)
  try {
    const pages = browser.contexts().flatMap(context => context.pages())
    const page = pages.find(p => /^https:\/\/(center-pf|business)\.kakao\.com\//.test(p.url()))
    if (!page) throw new Error('Kakao Business Center tab not found')
    const chats = await page.locator('a.link_chat').evaluateAll(items => items.map(el => ({
      href: el.getAttribute('href') || '',
      name: el.querySelector('.txt_name')?.textContent?.trim() || '',
      unread: Number((el.querySelector('.num_round')?.textContent || '0').replace(/[^0-9]/g, '')),
      lastMsg: el.querySelector('.txt_info')?.textContent?.trim() || '',
      time: el.querySelector('.txt_date')?.textContent?.trim() || '',
    })).filter(chat => chat.href && chat.name && chat.unread > 0))
    const db = readDb()
    db.chatHistory ||= []
    db.monitorStatus ||= {}
    const fresh = []
    for (const chat of chats) {
      const id = hash(chat.href)
      const existing = db.chatHistory.find(item => item.id === id)
      const signature = hash(`${chat.lastMsg}|${chat.time}|${chat.unread}`)
      if (!existing) {
        db.chatHistory.unshift({ id, href: chat.href, customerName: chat.name, lastMsg: chat.lastMsg,
          unread: chat.unread, signature, status: 'pending', lastActivity: new Date().toISOString() })
        fresh.push(chat)
      } else if (existing.signature !== signature) {
        Object.assign(existing, { lastMsg: chat.lastMsg, unread: chat.unread, signature,
          status: 'pending', lastActivity: new Date().toISOString() })
        fresh.push(chat)
      }
    }
    db.monitorStatus = { lastCheckedAt: new Date().toISOString(), unreadCount: chats.length, newCount: fresh.length }
    writeDb(db)
    console.log(JSON.stringify({ newInquiries: fresh, unreadCount: chats.length }))
  } finally {
    await browser.close()
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
