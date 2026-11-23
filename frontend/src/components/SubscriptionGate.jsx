import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'

const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const labels = { monthly: 'Mensal', semiannual: 'Semestral', annual: 'Anual' }

export default function SubscriptionGate({ enabled, userId, children }) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  useEffect(() => {
    if (!enabled || !userId) { setStatus(null); return }
    let live = true
    const refresh = () => api('/api/billing/status').then(value => {
      if (live) { setStatus(value); setError('') }
    }).catch(() => { if (live) setError('Não foi possível verificar sua assinatura. Tente novamente.') })
    refresh()
    const interval = setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    return () => { live = false; clearInterval(interval); window.removeEventListener('focus', refresh) }
  }, [enabled, userId])

  if (!enabled || !userId) return children
  if (status?.active) return children
  const checkout = async plan => {
    setBusy(plan)
    setError('')
    try {
      const result = await api('/api/billing/checkout', { method: 'POST', body: JSON.stringify({ plan }) })
      window.location.assign(result.url)
    } catch { setError('Não foi possível abrir o checkout. Tente novamente.') }
    finally { setBusy('') }
  }
  return <main style={{ maxWidth: 520, margin: '8vh auto', padding: '24px 20px', color: 'var(--label)' }}>
    <h1 style={{ fontSize: 30, marginBottom: 8 }}>Pump Life</h1>
    <p>Escolha seu plano para liberar seus treinos. A cobrança e a renovação acontecem no checkout seguro da Kiwify.</p>
    {!status && !error && <p>Verificando assinatura…</p>}
    {status && <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
      {status.plans.map(plan => <div key={plan.id} style={{ padding: 18, border: '1px solid var(--separator, #777)', borderRadius: 16 }}>
        <strong style={{ fontSize: 19 }}>{labels[plan.id]}</strong>
        <p style={{ margin: '8px 0' }}><s>{money(plan.listPriceCents)}</s> <strong>{money(plan.priceCents)}</strong> por {plan.months === 1 ? 'mês' : `${plan.months} meses`}</p>
        <p style={{ margin: '8px 0 14px' }}>R$ 10,00 de desconto em cada cobrança.</p>
        <button type="button" disabled={!status.ready || !!busy} onClick={() => checkout(plan.id)}>
          {busy === plan.id ? 'Abrindo…' : `Assinar plano ${labels[plan.id].toLowerCase()}`}
        </button>
      </div>)}
      {!status.ready && <p>Checkout em configuração. Volte em breve.</p>}
    </div>}
    {error && <p role="alert">{error}</p>}
    <button type="button" onClick={() => api('/api/billing/status').then(setStatus).catch(() => setError('Não foi possível verificar sua assinatura.'))} style={{ marginTop: 20 }}>Já paguei — verificar acesso</button>
  </main>
}

