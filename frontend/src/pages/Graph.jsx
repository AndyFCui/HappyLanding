import React, { useState } from 'react'

function Graph() {
  const [entityId, setEntityId] = useState('')
  const [neighbors, setNeighbors] = useState([])

  const handleSearch = async () => {
    if (!entityId.trim()) return

    // Demo mode - show mock graph data
    setNeighbors([
      { id: 'e1', type: 'Person', properties: { name: '张三', role: '工程师' } },
      { id: 'e2', type: 'Project', properties: { name: 'KMS项目', status: '进行中' } },
      { id: 'e3', type: 'Document', properties: { name: '架构设计文档', author: '李四' } }
    ])
  }

  return (
    <div className="card">
      <h2>知识图谱</h2>
      <div className="grid-2">
        <div>
          <div className="input-group">
            <label>实体 ID</label>
            <input
              type="text"
              placeholder="输入实体 ID..."
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
            />
          </div>
          <button className="btn" onClick={handleSearch}>查询</button>
        </div>
        <div>
          <h3>关联实体</h3>
          {neighbors.length === 0 ? (
            <p style={{ color: '#666' }}>输入实体 ID 查看关联关系</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {neighbors.map((entity) => (
                <div key={entity.id} className="service-item">
                  <div>
                    <strong>{entity.properties.name || entity.id}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '0.5rem' }}>
                      {entity.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="result" style={{ marginTop: '1rem', height: '300px', background: '#1a1a2e', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
          图谱可视化区域（需要 D3.js 或类似库实现）
        </div>
      </div>
    </div>
  )
}

export default Graph