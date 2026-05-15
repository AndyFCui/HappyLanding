import React, { useState, useEffect } from 'react'

const SERVICES = [
  { name: 'auth-service', port: 9999, description: '认证服务' },
  { name: 'search-service', port: 9998, description: '搜索服务' },
  { name: 'chat-service', port: 9997, description: '对话服务' },
  { name: 'graph-service', port: 9996, description: '图谱服务' },
  { name: 'document-service', port: 9995, description: '文档服务' },
  { name: 'report-service', port: 9994, description: '报告服务' },
  { name: 'onboarding-service', port: 9993, description: '入职服务' },
  { name: 'datasource-service', port: 9992, description: '数据源服务' }
]

function Services() {
  const [serviceStatus, setServiceStatus] = useState({})

  useEffect(() => {
    const checkServices = async () => {
      const results = {}
      for (const svc of SERVICES) {
        try {
          const res = await fetch(`http://192.168.1.117:${svc.port}/health`)
          const data = await res.json()
          results[svc.name] = { status: data.status === 'healthy', timestamp: data.timestamp }
        } catch {
          results[svc.name] = { status: false, timestamp: null }
        }
      }
      setServiceStatus(results)
    }

    checkServices()
    const interval = setInterval(checkServices, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="card">
      <h2>服务状态</h2>
      <div className="service-grid">
        {SERVICES.map((svc) => {
          const status = serviceStatus[svc.name]
          return (
            <div key={svc.name} className="service-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                <span className={`status ${status?.status === false ? 'error' : ''}`}></span>
                <strong>{svc.name}</strong>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>:{svc.port}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.25rem' }}>{svc.description}</p>
              {status?.timestamp && (
                <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                  {new Date(status.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Services