import assert from 'node:assert/strict'
import test from 'node:test'
import { SUBSCRIPTION_PLANS, subscriptionPlan } from '../subscriptions/plans.js'

test('discounted prices are derived from the quoted price in each plan', () => {
  for (const plan of Object.values(SUBSCRIPTION_PLANS)) {
    assert.equal(plan.recurringDiscountCents, 1000)
    assert.equal(plan.priceCents, plan.listPriceCents - plan.recurringDiscountCents)
  }
  assert.deepEqual(Object.values(SUBSCRIPTION_PLANS).map(p => [p.months, p.priceCents]), [
    [1, 1990], [6, 13900], [12, 23900],
  ])
})

test('unknown or inherited ids do not select a plan', () => {
  assert.equal(subscriptionPlan('monthly'), SUBSCRIPTION_PLANS.monthly)
  assert.equal(subscriptionPlan('__proto__'), null)
  assert.equal(subscriptionPlan('unknown'), null)
})

