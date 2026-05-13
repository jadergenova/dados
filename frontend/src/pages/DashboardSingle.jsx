import { KpiCard, SectionTitle, Card } from '../components/ui'
import { BarHorizontal, BarSimple, LineMulti } from '../components/charts'

const fmt = (v) => v >= 1e6 ? `R$ ${(v / 1e6).toFixed(2)}M` : `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtK = (v) => v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : v

const DAY_ORDER = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function DashboardSingle({ data, onBack }) {
  const { city, periodo, kpis, recorrencia, setores, produtos_top20, semanal, dias, pares_setores } = data

  const setoresChart = setores.map(s => ({ setor: s.setor, receita: s.receita }))
  const produtosChart = produtos_top20.slice(0, 10).map(p => ({ setor: p.produto, receita: p.receita }))
  const semanalChart = semanal.map(s => ({ name: s.semana.slice(5), value: s.receita }))
  const diasChart = DAY_ORDER.map(d => ({ name: d, value: dias[d] || 0 }))
  const paresChart = pares_setores.slice(0, 8).map(p => ({ setor: p.par, receita: p.cupons }))

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text-muted)' }}>
          ← Voltar
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>📊 {city}</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{periodo.inicio} a {periodo.fim}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 8 }}>
        <KpiCard label="Faturamento total" value={fmt(kpis.receita_total)} />
        <KpiCard label="Cupons únicos" value={fmtK(kpis.cupons_unicos)} />
        <KpiCard label="Clientes únicos" value={fmtK(kpis.clientes_unicos)} />
        <KpiCard label="Ticket médio" value={`R$ ${kpis.ticket_medio.toFixed(2)}`} sub={`mediana R$ ${kpis.ticket_mediana.toFixed(2)}`} />
        <KpiCard label="Receita/cliente" value={`R$ ${kpis.receita_por_cliente.toFixed(2)}`} />
        <KpiCard label="Top 20% clientes" value={`${kpis.top20_pct_receita.toFixed(1)}%`} sub="da receita total" />
      </div>

      <SectionTitle>Recorrência de clientes</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <KpiCard label="Fiéis (4+ visitas)" value={`${recorrencia.fiel_pct}%`} sub={`${fmtK(recorrencia.fiel)} clientes`} accent="#185fa5" />
        <KpiCard label="Regulares (2–3)" value={`${recorrencia.regular_pct}%`} sub={`${fmtK(recorrencia.regular)} clientes`} accent="#3266ad" />
        <KpiCard label="Ocasionais (1x)" value={`${recorrencia.ocasional_pct}%`} sub={`${fmtK(recorrencia.ocasional)} clientes`} accent="#85b7eb" />
      </div>

      <SectionTitle>Receita semanal</SectionTitle>
      <Card>
        <LineMulti data={semanalChart} keys={['value']} colors={['#3266ad']} height={220} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
        <div>
          <SectionTitle>Top 10 setores por receita</SectionTitle>
          <Card><BarHorizontal data={setoresChart} height={320} /></Card>
        </div>
        <div>
          <SectionTitle>Movimento por dia da semana</SectionTitle>
          <Card><BarSimple data={diasChart} height={220} /></Card>
          <SectionTitle>Top pares de setores (cesta)</SectionTitle>
          <Card><BarHorizontal data={paresChart} dataKey="receita" labelKey="setor" color="#639922" height={280} /></Card>
        </div>
      </div>

      <SectionTitle>Top 10 produtos por receita</SectionTitle>
      <Card><BarHorizontal data={produtosChart} height={340} /></Card>
    </div>
  )
}
