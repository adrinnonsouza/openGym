import crypto from 'node:crypto'
import { subscriptionPlan } from './plans.js'

const INTENT_LIFETIME_MS = 7 * 86400000

export function newCheckoutIntent(billing, uid, planId, now = Date.now()) {
  if (!subscriptionPlan(planId)) return null
  billing.intents ||= {}
  for (const [id, intent] of Object.entries(billing.intents)) {
    if (!intent || now - intent.createdAt > INTENT_LIFETIME_MS) delete billing.intents[id]
  }
  const id = crypto.randomBytes(24).toString('hex')
  billing.intents[id] = { uid, planId, createdAt: now }
  return id
}

export function checkoutUrl(base, intentId) {
  const url = new URL(base)
  if (url.protocol !== 'https:' || url.hostname !== 'pay.kiwify.com.br') throw new Error('invalid Kiwify checkout URL')
  url.searchParams.set('s1', intentId)
  return url.toString()
}

export function entitlementFor(billing, uid, now = Date.now()) {
  const rows = Object.values(billing?.subscriptions || {}).filter(s => s.uid === uid)
  const until = Math.max(0, ...rows.map(s => Date.parse(s.accessUntil) || 0))
  return { active: until > now, accessUntil: until ? new Date(until).toISOString() : null }
}

// Returns true only when the persisted billing state changed.
export function applyKiwifySale(billing, sale, expectedProductId, now = Date.now()) {
  if (!sale || sale.productId !== expectedProductId || !sale.subscriptionId) return false
  billing.intents ||= {}
  billing.subscriptions ||= {}
  billing.orders ||= {}
  billing.events ||= {}
  if (billing.events[sale.key]) return false

  const existing = billing.subscriptions[sale.subscriptionId]
  const intent = sale.checkoutIntent && billing.intents[sale.checkoutIntent]
  const fresh = intent && now - intent.createdAt <= INTENT_LIFETIME_MS ? intent : null
  const owner = existing?.uid || fresh?.uid
  const planId = existing?.planId || fresh?.planId
  if (!owner || !subscriptionPlan(planId) || (existing && fresh && existing.uid !== fresh.uid)) return false

  const paid = (sale.event === 'order_approved' || sale.event === 'subscription_renewed') && sale.orderStatus === 'paid'
  const revoked = sale.event === 'order_refunded' || sale.event === 'order_chargedback'
  const until = Date.parse(sale.accessUntil)
  if (paid && (!Number.isFinite(until) || until <= now)) return false

  if (paid) {
    const previous = Date.parse(existing?.accessUntil) || 0
    billing.subscriptions[sale.subscriptionId] = {
      uid: owner, planId, accessUntil: new Date(Math.max(previous, until)).toISOString(),
      status: 'active',
    }
    billing.orders[sale.orderId] = sale.subscriptionId
    if (fresh) delete billing.intents[sale.checkoutIntent]
  } else if (revoked && billing.orders[sale.orderId] === sale.subscriptionId && existing) {
    billing.subscriptions[sale.subscriptionId] = { ...existing, accessUntil: new Date(now).toISOString(), status: 'revoked' }
  } else if (sale.event === 'subscription_canceled' && existing) {
    billing.subscriptions[sale.subscriptionId] = { ...existing, status: 'canceled' }
  } else return false

  billing.events[sale.key] = true
  return true
}

