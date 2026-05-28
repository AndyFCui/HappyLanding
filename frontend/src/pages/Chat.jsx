import React, { useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8080'

function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_BASE}/v1/chat/sessions/demo-session/messages`, {
        content: input
      })
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.content }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `这是对 "${input}" 的演示回复。\n\n实际功能需要连接 AWS Bedrock Claude 服务。`
      }])
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">AI 对话</h2>
      <div className="border border-gray-200 rounded-lg h-96 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-gray-500 text-center py-8">欢迎使用 AI 助手！输入您的问题开始对话。</p>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-100 ml-8' : 'bg-gray-100 mr-8'}`}>
              <p className="font-semibold text-xs mb-1">{msg.role === 'user' ? '用户' : 'AI'}</p>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
          {loading && <div className="bg-gray-100 mr-8 p-3 rounded-lg">思考中...</div>}
        </div>
        <form onSubmit={handleSend} className="border-t border-gray-200 p-4 flex gap-3">
          <input
            type="text"
            placeholder="输入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
          >
            发送
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat