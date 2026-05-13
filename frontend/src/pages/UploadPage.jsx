import { useState } from 'react'

function StoreInput({ index, store, onChange, onRemove, canRemove }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 16, position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 500, fontSize: 13 }}>Loja {index + 1}</span>
        {canRemove && (
          <button onClick={onRemove} style={{
            background: 'none', border: 'none', color: '#9ca3af', fontSize: 18, lineHeight: 1
          }}>×</button>
        )}
      </div>
      <input
        type="text"
        placeholder="Nome da cidade (ex: Marília-SP)"
        value={store.city}
        onChange={e => onChange({ ...store, city: e.target.value })}
        style={{
          width: '100%', padding: '8px 10px', border: '1px solid var(--border)',
          borderRadius: 6, fontSize: 13, marginBottom: 10, outline: 'none'
        }}
      />
      <label style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
        border: `1.5px dashed ${store.file ? '#3266ad' : '#d1d5db'}`,
        borderRadius: 6, cursor: 'pointer',
        background: store.file ? 'var(--primary-light)' : '#fafafa',
        transition: 'all 0.15s'
      }}>
        <span style={{ fontSize: 20 }}>{store.file ? '✓' : '📂'}</span>
        <span style={{ fontSize: 12, color: store.file ? '#3266ad' : '#6b7280' }}>
          {store.file ? store.file.name : 'Selecionar arquivo .dsv ou .csv'}
        </span>
        <input
          type="file" accept=".dsv,.csv" style={{ display: 'none' }}
          onChange={e => onChange({ ...store, file: e.target.files[0] || null })}
        />
      </label>
    </div>
  )
}

export function UploadPage({ onAnalyze }) {
  const [stores, setStores] = useState([
    { city: '', file: null },
    { city: '', file: null },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('compare') // 'single' | 'compare'

  const updateStore = (i, val) => setStores(prev => prev.map((s, idx) => idx === i ? val : s))
  const addStore = () => setStores(prev => [...prev, { city: '', file: null }])
  const removeStore = (i) => setStores(prev => prev.filter((_, idx) => idx !== i))

  const ready = mode === 'single'
    ? stores[0].file && stores[0].city
    : stores.every(s => s.file && s.city)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await onAnalyze(mode === 'single' ? [stores[0]] : stores, mode)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Supermarket Analytics</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Faça upload dos arquivos de cada loja para análise de comportamento de compra
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#f3f4f6', borderRadius: 8, padding: 4 }}>
        {['single', 'compare'].map(m => (
          <button key={m} onClick={() => {
            setMode(m)
            setStores(m === 'single' ? [{ city: '', file: null }] : [{ city: '', file: null }, { city: '', file: null }])
          }} style={{
            flex: 1, padding: '8px 0', border: 'none', borderRadius: 6, fontWeight: 500,
            background: mode === m ? '#fff' : 'transparent',
            color: mode === m ? 'var(--text)' : 'var(--text-muted)',
            boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s'
          }}>
            {m === 'single' ? 'Análise única' : 'Comparar lojas'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stores.map((store, i) => (
          <StoreInput
            key={i} index={i} store={store}
            onChange={val => updateStore(i, val)}
            onRemove={() => removeStore(i)}
            canRemove={stores.length > 2 && mode === 'compare'}
          />
        ))}
      </div>

      {mode === 'compare' && stores.length < 3 && (
        <button onClick={addStore} style={{
          width: '100%', marginTop: 10, padding: '10px 0',
          border: '1.5px dashed #d1d5db', borderRadius: 8,
          background: 'none', color: 'var(--text-muted)', fontSize: 13
        }}>
          + Adicionar terceira loja
        </button>
      )}

      {error && (
        <div style={{ marginTop: 12, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!ready || loading}
        style={{
          width: '100%', marginTop: 20, padding: '13px 0', borderRadius: 8,
          border: 'none', background: ready ? 'var(--primary)' : '#e5e7eb',
          color: ready ? '#fff' : '#9ca3af', fontWeight: 600, fontSize: 14,
          transition: 'all 0.15s'
        }}
      >
        {loading ? 'Analisando...' : 'Analisar'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 12 }}>
        Arquivos aceitos: .dsv com separador <code>;</code> e decimal <code>,</code>
      </p>
    </div>
  )
}
