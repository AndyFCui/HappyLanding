import React, { useState } from 'react'

function Documents() {
  const [documents, setDocuments] = useState([
    { id: '1', title: '架构设计文档.pdf', type: 'pdf', size: '2.5MB', date: '2026-05-10' },
    { id: '2', title: '产品需求文档.docx', type: 'word', size: '1.2MB', date: '2026-05-08' },
    { id: '3', title: '会议记录.md', type: 'markdown', size: '15KB', date: '2026-05-05' }
  ])
  const [uploading, setUploading] = useState(false)

  const handleUpload = () => {
    setUploading(true)
    setTimeout(() => {
      setDocuments(prev => [...prev, {
        id: String(Date.now()),
        title: '新上传文档.pdf',
        type: 'pdf',
        size: '1MB',
        date: new Date().toISOString().split('T')[0]
      }])
      setUploading(false)
    }, 1500)
  }

  return (
    <div className="card">
      <h2>文档管理</h2>
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn" onClick={handleUpload} disabled={uploading}>
          {uploading ? '上传中...' : '上传文档'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {documents.map((doc) => (
          <div key={doc.id} className="service-item">
            <div>
              <strong>{doc.title}</strong>
              <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '1rem' }}>
                {doc.type.toUpperCase()} | {doc.size} | {doc.date}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>下载</button>
              <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: '#ef4444' }}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Documents