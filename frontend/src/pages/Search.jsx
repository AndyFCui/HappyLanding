import React, { useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://192.168.1.117:9998'

function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchType, setSearchType] = useState('all')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE}/v1/search`, {
        query,
        type: searchType,
        page: 1,
        size: 20
      }, {
        headers: { Authorization: 'Bearer demo-token' }
      })
      setResults(response.data.results || [])
    } catch (error) {
      // Demo mode - show mock results
      setResults([
        { id: '1', title: `关于 "${query}" 的搜索结果`, type: 'document', snippet: '这是示例搜索结果。实际功能需要后端服务连接。' },
        { id: '2', title: `${query} 相关文档`, type: 'kb_article', snippet: '知识库相关文章，内容由 AI 检索生成。' }
      ])
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <h2>统一搜索</h2>
      <div className="search-box">
        <input
          type="text"
          placeholder="输入关键词搜索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
        />
        <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
          <option value="all">全部</option>
          <option value="documents">文档</option>
          <option value="messages">消息</option>
          <option value="links">链接</option>
          <option value="kb_articles">知识库</option>
        </select>
        <button onClick={handleSearch} disabled={loading}>
          {loading ? '搜索中...' : '搜索'}
        </button>
      </div>

      <div className="results">
        {results.length === 0 && !loading && (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            输入关键词开始搜索
          </p>
        )}
        {results.map((result) => (
          <div key={result.id} className="service-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="status"></span>
              <strong>{result.title}</strong>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>{result.type}</span>
            </div>
            {result.snippet && (
              <p style={{ fontSize: '0.9rem', color: '#555' }}>{result.snippet}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Search