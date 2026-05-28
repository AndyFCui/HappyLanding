import React, { useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8080'

function Graph() {
  const [entityId, setEntityId] = useState('')
  const [neighbors, setNeighbors] = useState([])

  const handleSearch = async () => {
    if (!entityId.trim()) return

    try {
      const response = await axios.get(`${API_BASE}/v1/graph/entities/${entityId}/neighbors`)
      setNeighbors(response.data.neighbors || [])
    } catch {
      setNeighbors([
        { id: 'e1', type: 'Person', properties: { name: '张三', role: '工程师' } },
        { id: 'e2', type: 'Project', properties: { name: 'KMS项目', status: '进行中' } },
        { id: 'e3', type: 'Document', properties: { name: '架构设计文档', author: '李四' } }
      ])
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">知识图谱</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">实体 ID</label>
            <input
              type="text"
              placeholder="输入实体 ID..."
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            查询
          </button>
        </div>
        <div>
          <h3 className="font-semibold mb-2">关联实体</h3>
          {neighbors.length === 0 ? (
            <p className="text-gray-500">输入实体 ID 查看关联关系</p>
          ) : (
            <div className="space-y-2">
              {neighbors.map((entity) => (
                <div key={entity.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <strong>{entity.properties.name || entity.id}</strong>
                    <span className="ml-2 text-sm text-gray-500">{entity.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="h-80 bg-slate-800 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">图谱可视化区域（需要 D3.js 或类似库实现）</span>
      </div>
    </div>
  )
}

export default Graph