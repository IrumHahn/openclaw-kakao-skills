#!/usr/bin/env node
// One-off send. Requires a unique, exact customer name; never picks a partial match.
const { chromium } = require('playwright')
const [name, message] = process.argv.slice(2)
if (!name?.trim() || !message?.trim()) {
  console.error('Usage: node bizchat-send-safe.js "exact customer name" "message"')
  process.exit(1)
}

async function main() {
  const browser = await chromium.connectOverCDP(process.env.BIZCHAT_CDP_URL || 'http://127.0.0.1:9222')
  try {
    const contexts = browser.contexts()
    const page = contexts.flatMap(context => context.pages()).find(p =>
      /^https:\/\/(center-pf|business)\.kakao\.com\//.test(p.url()))
    if (!page) throw new Error('Kakao Business Center tab not found')
    const candidates = await page.locator('a.link_chat').evaluateAll(items => items.map((el, index) => ({
      index, name: el.querySelector('.txt_name')?.textContent?.trim(), href: el.getAttribute('href') || ''
    })).filter(item => item.name === name))
    if (candidates.length !== 1) throw new Error(`Expected one exact customer match; found ${candidates.length}`)
    const target = candidates[0]
    if (!target.href || !/^\/?[^:]+$/.test(target.href)) throw new Error('Unsafe or missing chat URL')
    const item = page.locator('a.link_chat').nth(target.index)
    const [chatPage] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 10000 }), item.click()
    ])
    await chatPage.waitForLoadState('domcontentloaded')
    const expected = new URL(target.href, page.url())
    const actual = new URL(chatPage.url())
    if (expected.origin !== actual.origin || expected.pathname !== actual.pathname)
      throw new Error('Opened chat URL differs from selected customer; nothing sent')
    const input = chatPage.locator('textarea.tf_g')
    if (await input.count() !== 1) throw new Error('Expected one message input; nothing sent')
    const send = chatPage.getByRole('button', { name: '전송', exact: true })
    if (await send.count() !== 1) throw new Error('Expected one Send button; nothing sent')
    await input.fill(message)
    await send.click()
    console.log(JSON.stringify({ status: 'sent_unverified', customer: name, chatUrl: actual.origin + actual.pathname,
      note: 'Check the outgoing bubble in the selected customer chat before reporting success or retrying.' }))
  } finally {
    await browser.close()
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
