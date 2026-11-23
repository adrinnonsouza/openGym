import crypto from 'node:crypto'

// Kiwify signs the exact request body and sends the hex digest in ?signature=.
// Reject a missing token so a production instance cannot accept unsigned events.
export function verifyKiwifySignature(rawBody, signature, token) {
  if (!token || !/^[a-f0-9]{40}$/i.test(signature || '')) return false
  const received = Buffer.from(signature, 'hex')
  const expected = crypto.createHmac('sha1', token).update(rawBody).digest()
  return crypto.timingSafeEqual(received, expected)
}

export function parseKiwifySale(body) {
  if (!body || typeof body !== 'object') return null
  const event = body.webhook_event_type
  const orderId = body.order_id
  const productId = body.Product?.product_id
  const subscriptionId = body.subscription_id || body.Subscription?.id
  if (typeof event !== 'string' || typeof orderId !== 'string' || typeof productId !== 'string') return null
  return {
    key: `${orderId}:${event}`,
    event,
    orderId,
    orderStatus: body.order_status,
    productId,
    offerId: body.Product?.product_offer_id || null,
    subscriptionId: typeof subscriptionId === 'string' ? subscriptionId : null,
    checkoutIntent: body.TrackingParameters?.s1 || null,
    accessUntil: body.Subscription?.customer_access?.access_until || null,
  }
}

