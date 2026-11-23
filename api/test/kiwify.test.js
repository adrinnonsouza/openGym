import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import { verifyKiwifySignature, parseKiwifySale } from '../subscriptions/kiwify.js'

test('Kiwify signature validates the raw request and fails closed', () => {
  const raw = '{"order_id":"order-1","order_status":"paid"}'
  const token = 'a-random-webhook-token'
  const signature = crypto.createHmac('sha1', token).update(raw).digest('hex')
  assert.equal(verifyKiwifySignature(raw, signature, token), true)
  assert.equal(verifyKiwifySignature(raw + ' ', signature, token), false)
  assert.equal(verifyKiwifySignature(raw, signature, ''), false)
  assert.equal(verifyKiwifySignature(raw, 'bad', token), false)
})

test('sale parser keeps only identifiers needed for entitlement reconciliation', () => {
  const sale = parseKiwifySale({
    order_id: 'order-1', webhook_event_type: 'order_approved', order_status: 'paid',
    Product: { product_id: 'product-1', product_offer_id: 'offer-1' },
    Subscription: { id: 'subscription-1', customer_access: { access_until: '2027-01-01T00:00:00Z' } },
    TrackingParameters: { s1: 'intent-1' },
    Customer: { email: 'example@example.com' },
  })
  assert.deepEqual(sale, {
    key: 'order-1:order_approved', event: 'order_approved', orderId: 'order-1',
    orderStatus: 'paid', productId: 'product-1', offerId: 'offer-1',
    subscriptionId: 'subscription-1', checkoutIntent: 'intent-1', accessUntil: '2027-01-01T00:00:00Z',
  })
  assert.equal(parseKiwifySale({ webhook_event_type: 'order_approved' }), null)
})

