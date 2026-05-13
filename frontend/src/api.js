const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function analyzeSingle(file, city) {
  const form = new FormData()
  form.append('file', file)
  form.append('city', city)
  const res = await fetch(`${BASE}/analyze/single`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function analyzeCompare(stores) {
  const form = new FormData()
  stores.forEach((s, i) => {
    const suffix = i === 0 ? '1' : i === 1 ? '2' : '3'
    form.append(`file${suffix}`, s.file)
    form.append(`city${suffix}`, s.city)
  })
  const endpoint = `${BASE}/analyze/compare`
  const res = await fetch(endpoint, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
