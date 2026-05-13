export function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '14px 16px',
      borderTop: accent ? `3px solid ${accent}` : undefined,
    }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 600 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</p>}
    </div>
  )
}

export function SectionTitle({ children }) {
  return (
    <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', margin: '1.5rem 0 0.75rem' }}>
      {children}
    </h3>
  )
}

export function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 16, ...style
    }}>
      {children}
    </div>
  )
}
