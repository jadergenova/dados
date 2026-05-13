import { useState } from 'react'
import { KpiCard, SectionTitle, Card } from '../components/ui'
import { BarGrouped, LineMulti, BarSimple } from '../components/charts'

const COLORS = ['#3266ad', '#e3a042', '#639922']
const fmt = (v) => v >= 1e6 ? `R$ ${(v / 1e6).toFixed(2)}M` : `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtK = (v) => v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : v
const DAY_ORDER = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function DashboardCompare({ data, onBack }) {
  const { lojas, comparativo } = data
  const [tab, setTab] = useState('geral')

  const tabs = ['geral', 'setores', 'produtos', 'recorrencia', 'temporal', 'universais']
  const tabLabels = { geral: 'Geral', setores: 'Setores', produtos: 'Produtos', recorrencia: 'Recorrência', temporal: 'Temporal', universais: 'Produtos universais' }

  // Build multi-store data
  const kpiCompar = [
    { name: 'Faturamento (R$M)', ...Object.fromEntries(lojas.map(l => [l.city, l.kpis.receita_total / 1e6])) },
    { name: 'Cupons (mil)', ...Object.fromEntries(lojas.map(l => [l.city, l.kpis.cupons_unicos / 1e3])) },
    { name: 'Clientes (mil)', ...Object.fromEntries(lojas.map(l => [l.city, l.kpis.clientes_unicos / 1e3])) },
    { name: 'Ticket (R$)', ...Object.fromEntries(lojas.map(l => [l.city, l.kpis.ticket_medio])) },
  ]

  // Setores
  const allSetores = [...new Set(lojas.flatMap(l => l.setores.map(s => s.setor)))]
  const setoresData = allSetores.slice(0, 10).map(s => ({
    name: s,
    ...Object.fromEntries(lojas.map(l => {
      const found = l.setores.find(x => x.setor === s)
      return [l.city, found ? found.receita : 0]
    }))
  }))

  // Semanal
  const allWeeks = [...new Set(lojas.flatMap(l => l.semanal.map(s => s.semana)))].sort()
  const semanalData = allWeeks.map(w => ({
    name: w.slice(5),
    ...Object.fromEntries(lojas.map(l => {
      const found = l.semanal.find(s => s.semana === w)
      return [l.city, found ? found.receita : 0]
    }))
  }))

  // Dias
  const diasData = DAY_ORDER.map(d => ({
    name: d,
    ...Object.fromEntries(lojas.map(l => [l.city, l.dias[d] || 0]))
  }))

  // Recorrência
  const recData = [
    { name: 'Fiéis (4+)', ...Object.fromEntries(lojas.map(l => [l.city, l.recorrencia.fiel_pct])) },
    { name: 'Regulares (2-3)', ...Object.fromEntries(lojas.map(l => [l.city, l.recorrencia.regular_pct])) },
    { name: 'Ocasionais (1x)', ...Object.fromEntries(lojas.map(l => [l.city, l.recorrencia.ocasional_pct])) },
  ]

  const cityKeys = lojas.map(l => l.city)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text-muted)' }}>← Voltar</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>📊 Comparativo de lojas</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lojas.map(l => l.city).join(' · ')}</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {lojas.map((l, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: COLORS[i] + '22', color: COLORS[i] }}>
              ● {l.city}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 14px', borderRadius: 6, border: '1px solid', fontSize: 13,
            borderColor: tab === t ? 'var(--primary)' : 'var(--border)',
            background: tab === t ? 'var(--primary-light)' : 'transparent',
            color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: tab === t ? 500 : 400
          }}>{tabLabels[t]}</button>
        ))}
      </div>

      {/* GERAL */}
      {tab === 'geral' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${lojas.length}, 1fr)`, gap: 10, marginBottom: 16 }}>
            {lojas.map((l, i) => (
              <KpiCard key={i} label={l.city} value={fmt(l.kpis.receita_total)}
                sub={`${fmtK(l.kpis.clientes_unicos)} clientes · ticket R$ ${l.kpis.ticket_medio.toFixed(0)}`}
                accent={COLORS[i]} />
            ))}
          </div>
          <SectionTitle>Comparativo de indicadores</SectionTitle>
          <Card><BarGrouped data={kpiCompar} keys={cityKeys} colors={COLORS} height={300} /></Card>
          <SectionTitle>Sobreposição de base de clientes</SectionTitle>
          <Card>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {Object.entries(comparativo.overlap_cpf).map(([k, v]) => (
                <div key={k} style={{ fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                  <strong>{v}</strong> CPFs
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
              Bases praticamente independentes — sem canibalização entre unidades.
            </p>
          </Card>
        </>
      )}

      {/* SETORES */}
      {tab === 'setores' && (
        <>
          <SectionTitle>Receita por setor nas lojas</SectionTitle>
          <Card><BarGrouped data={setoresData} keys={cityKeys} colors={COLORS} height={400} /></Card>
        </>
      )}

      {/* PRODUTOS */}
      {tab === 'produtos' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${lojas.length}, 1fr)`, gap: 16 }}>
            {lojas.map((l, i) => (
              <div key={i}>
                <SectionTitle>{l.city}</SectionTitle>
                <Card>
                  {l.produtos_top20.slice(0, 10).map((p, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: j < 9 ? '1px solid #f3f4f6' : 'none', fontSize: 12 }}>
                      <span style={{ width: 16, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>#{j + 1}</span>
                      <div style={{ height: 6, borderRadius: 3, background: COLORS[i], width: `${p.receita / l.produtos_top20[0].receita * 80}px`, flexShrink: 0 }} />
                      <span style={{ flex: 1, lineHeight: 1.3 }}>{p.produto}</span>
                      <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>R${(p.receita / 1000).toFixed(0)}k</span>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
          </div>
        </>
      )}

      {/* RECORRÊNCIA */}
      {tab === 'recorrencia' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${lojas.length}, 1fr)`, gap: 10, marginBottom: 16 }}>
            {lojas.map((l, i) => (
              <KpiCard key={i} label={`Fiéis — ${l.city}`} value={`${l.recorrencia.fiel_pct}%`}
                sub={`Ocasionais: ${l.recorrencia.ocasional_pct}%`} accent={COLORS[i]} />
            ))}
          </div>
          <SectionTitle>Distribuição de recorrência (%)</SectionTitle>
          <Card><BarGrouped data={recData} keys={cityKeys} colors={COLORS} height={260} /></Card>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${lojas.length}, 1fr)`, gap: 10, marginTop: 12 }}>
            {lojas.map((l, i) => (
              <KpiCard key={i} label={`Top 20% clientes — ${l.city}`}
                value={`${l.kpis.top20_pct_receita.toFixed(1)}%`} sub="da receita total" />
            ))}
          </div>
        </>
      )}

      {/* TEMPORAL */}
      {tab === 'temporal' && (
        <>
          <SectionTitle>Receita semanal</SectionTitle>
          <Card><LineMulti data={semanalData} keys={cityKeys} colors={COLORS} height={260} /></Card>
          <SectionTitle>Movimento por dia da semana</SectionTitle>
          <Card><BarGrouped data={diasData} keys={cityKeys} colors={COLORS} height={240} /></Card>
        </>
      )}

      {/* UNIVERSAIS */}
      {tab === 'universais' && (
        <>
          <SectionTitle>Produtos presentes no top 20 de todas as lojas ({comparativo.produtos_universais.length})</SectionTitle>
          <Card>
            {comparativo.produtos_universais.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < comparativo.produtos_universais.length - 1 ? '1px solid #f3f4f6' : 'none', fontSize: 12, flexWrap: 'wrap' }}>
                <span style={{ flex: 1, fontWeight: 500 }}>{p.produto}</span>
                {Object.entries(p.lojas).map(([city, info], j) => (
                  <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: COLORS[j] + '22', color: COLORS[j], whiteSpace: 'nowrap' }}>
                    #{info.rank} · R${(info.receita / 1000).toFixed(0)}k
                  </span>
                ))}
              </div>
            ))}
          </Card>

          <SectionTitle>Exclusivos por loja (top 20 de apenas uma cidade)</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${lojas.length}, 1fr)`, gap: 12 }}>
            {lojas.map((l, i) => {
              const excl = comparativo.exclusivos_por_loja[l.city] || []
              return (
                <div key={i}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: COLORS[i], marginBottom: 8 }}>{l.city} ({excl.length})</p>
                  <Card>
                    {excl.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum exclusivo</p>}
                    {excl.map((p, j) => (
                      <div key={j} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: j < excl.length - 1 ? '1px solid #f3f4f6' : 'none', fontSize: 12 }}>
                        <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 20, background: COLORS[i] + '22', color: COLORS[i], flexShrink: 0 }}>#{p.rank}</span>
                        <span style={{ flex: 1 }}>{p.produto}</span>
                        <span style={{ color: 'var(--text-muted)' }}>R${(p.receita / 1000).toFixed(0)}k</span>
                      </div>
                    ))}
                  </Card>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
