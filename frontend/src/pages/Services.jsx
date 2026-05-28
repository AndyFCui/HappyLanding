import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8080'

const SERVICES = [
  { name: 'auth-service', description: '认证服务' },
  { name: 'search-service', description: '搜索服务' },
  { name: 'chat-service', description: '对话服务' },
  { name: 'graph-service', description: '图谱服务' },
  { name: 'document-service', description: '文档服务' },
  { name: 'report-service', description: '报告服务' },
  { name: 'onboarding-service', description: '入职服务' },
  { name: 'datasource-service', description: '数据源服务' }
]

function Services() {
  const [serviceStatus, setServiceStatus] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkFastAPI = async () => {
      try {
        const res = await axios.get(`${API_BASE}/health`)
        setServiceStatus({
          'fastapi-backend': {
            status: res.data.status === 'healthy',
            timestamp: res.data.timestamp
          }
        })
      } catch {
        setServiceStatus({
          'fastapi-backend': { status: false, timestamp: null }
        })
      }
      setLoading(false)
    }

    checkFastAPI()
  }, [])

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">服务状态</h2>
      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(serviceStatus).map(([name, info]) => (
            <div key={name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${info.status ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <strong>{name}</strong>
              </div>
              <p className="text-sm text-gray-500">
                {info.status ? '运行中' : '离线'}
              </p>
              {info.timestamp && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(info.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">说明</h3>
        <p className="text-sm text-gray-600">
          当前显示的是 FastAPI 统一后端服务（端口 8080）。原有的 Node.js 微服务（端口 9992-9999）可在 EKS 部署时重新启用。
        </p>
      </div>
    </div>
  )
}

export default Services