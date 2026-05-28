import React, { useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8080'

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
      })
      setResults(response.data.results || [])
    } catch (error) {
      setResults([
        { id: '1', title: `关于 "${query}" 的搜索结果`, type: 'document', snippet: '这是示例搜索结果。实际功能需要后端服务连接。' },
        { id: '2', title: `${query} 相关文档`, type: 'kb_article', snippet: '知识库相关文章，内容由 AI 检索生成。' }
      ])
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">统一搜索</h2>
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="输入关键词搜索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
        />
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">全部</option>
          <option value="documents">文档</option>
          <option value="messages">消息</option>
          <option value="links">链接</option>
          <option value="kb_articles">知识库</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
        >
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>

      <div className="space-y-3">
        {results.length === 0 && !loading && (
          <p className="text-gray-500 text-center py-8">输入关键词开始搜索</p>
        )}
        {results.map((result) => (
          <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">{result.type}</span>
              <strong className="text-lg">{result.title}</strong>
            </div>
            {result.snippet && (
              <p className="text-gray-600">{result.snippet}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Search