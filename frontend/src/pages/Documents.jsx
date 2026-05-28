import React, { useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8080'

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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">文档管理</h2>
      <div className="mb-4">
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
        >
          {uploading ? '上传中...' : '上传文档'}
        </button>
      </div>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded uppercase">{doc.type}</span>
              <strong>{doc.title}</strong>
              <span className="text-sm text-gray-500">{doc.size} | {doc.date}</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">下载</button>
              <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm">删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Documents