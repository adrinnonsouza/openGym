import assert from 'node:assert/strict'
import test from 'node:test'
import { newCheckoutIntent, checkoutUrl, entitlementFor, applyKiwifySale } from '../subscriptions/entitlements.js'

const NOW = Date.parse('2026-11-23T12:00:00Z')
const paid = (intent, until = '2026-12-23T12:00:00Z') => ({
  key: 'order-1:order_approved', event: 'order_approved', orderId: 'order-1', orderStatus: 'paid',
  productId: 'product-1', subscriptionId: 'sub-1', checkoutIntent: intent, accessUntil: until,
})

test('checkout binds a random intent to one account and keeps the checkout on Kiwify', () => {
  const billing = {}
  const id = newCheckoutIntent(billing, 'user-1', 'monthly', NOW)
  assert.match(id, /^[a-f0-9]{48}$/)
  assert.deepEqual(billing.intents[id], { uid: 'user-1', planId: 'monthly', createdAt: NOW })
  assert.equal(new URL(checkoutUrl('https://pay.kiwify.com.br/abc', id)).searchParams.get('s1'), id)
  assert.throws(() => checkoutUrl('https://example.com/abc', id))
  assert.equal(newCheckoutIntent(billing, 'user-1', '__proto__', NOW), null)
})

test('verified paid events grant access once, renewals extend it, refunds revoke it', () => {
  const billing = {}
  const id = newCheckoutIntent(billing, 'user-1', 'monthly', NOW)
  assert.equal(applyKiwifySale(billing, paid(id), 'other-product', NOW), false)
  assert.equal(applyKiwifySale(billing, paid(id), 'product-1', NOW), true)
  assert.equal(entitlementFor(billing, 'user-1', NOW).active, true)
  assert.equal(applyKiwifySale(billing, paid(id), 'product-1', NOW), false)
  const renewal = { ...paid(null, '2027-01-23T12:00:00Z'), key: 'order-2:subscription_renewed', event: 'subscription_renewed', orderId: 'order-2' }
  assert.equal(applyKiwifySale(billing, renewal, 'product-1', NOW), true)
  assert.equal(entitlementFor(billing, 'user-1', NOW).accessUntil, '2027-01-23T12:00:00.000Z')
  const refund = { ...renewal, key: 'order-2:order_refunded', event: 'order_refunded' }
  assert.equal(applyKiwifySale(billing, refund, 'product-1', NOW), true)
  assert.equal(entitlementFor(billing, 'user-1', NOW).active, false)
})

test('unpaid or unlinked events cannot grant access', () => {
  const billing = {}
  const id = newCheckoutIntent(billing, 'user-1', 'annual', NOW)
  assert.equal(applyKiwifySale(billing, { ...paid(id), orderStatus: 'waiting_payment' }, 'product-1', NOW), false)
  assert.equal(applyKiwifySale(billing, { ...paid(id), checkoutIntent: 'unknown' }, 'product-1', NOW), false)
  assert.equal(applyKiwifySale(billing, paid(id, null), 'product-1', NOW), false)
  assert.equal(entitlementFor(billing, 'user-1', NOW).active, false)
})

