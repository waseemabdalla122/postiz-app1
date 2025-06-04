'use client'
import { useState } from 'react'

export const dynamic = 'force-dynamic'

export default function PdfUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setError(null)
    setProgress(0)
    setResult(null)
    const formData = new FormData()
    formData.append('pdf', file)
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload')
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setResult(JSON.parse(xhr.responseText))
          setProgress(100)
          resolve()
        } else {
          setError('Upload failed')
          reject(new Error('Upload failed'))
        }
      }
      xhr.onerror = () => {
        setError('Upload failed')
        reject(new Error('Upload failed'))
      }
      xhr.send(formData)
    })
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h1>PDF Quiz Generator</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
        <input
          type='file'
          accept='application/pdf'
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        {file && <span style={{ marginLeft: '0.5rem' }}>{file.name}</span>}
        <button type='submit' style={{ marginLeft: '0.5rem' }}>
          Upload
        </button>
      </form>
      {progress > 0 && progress < 100 && (
        <progress value={progress} max='100' style={{ width: '100%' }} />
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && result.data && (
        <div style={{ marginTop: '1rem' }}>
          <h2>Topics</h2>
          <ul>
            {result.data.topics &&
              result.data.topics.map((t: string) => <li key={t}>{t}</li>)}
          </ul>
          <h2>Questions</h2>
          <ol>
            {result.data.questions &&
              result.data.questions.map((q: string) => <li key={q}>{q}</li>)}
          </ol>
        </div>
      )}
    </div>
  )
}
