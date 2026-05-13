import { useState } from 'react'
import { UploadPage } from './pages/UploadPage'
import { DashboardSingle } from './pages/DashboardSingle'
import { DashboardCompare } from './pages/DashboardCompare'
import { analyzeSingle, analyzeCompare } from './api'

export default function App() {
  const [page, setPage] = useState('upload') // 'upload' | 'single' | 'compare'
  const [result, setResult] = useState(null)

  const handleAnalyze = async (stores, mode) => {
    if (mode === 'single') {
      const data = await analyzeSingle(stores[0].file, stores[0].city)
      setResult(data)
      setPage('single')
    } else {
      const data = await analyzeCompare(stores)
      setResult(data)
      setPage('compare')
    }
  }

  const handleBack = () => {
    setPage('upload')
    setResult(null)
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {page === 'upload' && <UploadPage onAnalyze={handleAnalyze} />}
      {page === 'single' && result && <DashboardSingle data={result} onBack={handleBack} />}
      {page === 'compare' && result && <DashboardCompare data={result} onBack={handleBack} />}
    </div>
  )
}
