// Amounts are integer centavos; keep the catalogue and checkout amounts together.
export const SUBSCRIPTION_PLANS = Object.freeze({
  monthly: Object.freeze({ id: 'monthly', months: 1, listPriceCents: 2990, recurringDiscountCents: 1000, priceCents: 1990 }),
  semiannual: Object.freeze({ id: 'semiannual', months: 6, listPriceCents: 14900, recurringDiscountCents: 1000, priceCents: 13900 }),
  annual: Object.freeze({ id: 'annual', months: 12, listPriceCents: 24900, recurringDiscountCents: 1000, priceCents: 23900 }),
})

export function subscriptionPlan(id) {
  return Object.hasOwn(SUBSCRIPTION_PLANS, id) ? SUBSCRIPTION_PLANS[id] : null
}

