import React, { useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://192.168.1.117:9997'

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
      const response = await axios.post(`${API_BASE}/v1/chat/sessions/demo-sessionId/messages`, {
        content: input
      }, {
        headers: { Authorization: 'Bearer demo-token' }
      })
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.content }])
    } catch (error) {
      // Demo mode
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `这是对 "${input}" 的演示回复。\n\n实际功能需要连接后端 AI 服务（Bedrock Claude）。当前显示的是占位文本，用于演示界面布局和交互流程。`
      }])
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <h2>AI 对话</h2>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              欢迎使用 AI 助手！输入您的问题开始对话。
            </p>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {loading && <div className="message assistant">思考中...</div>}
        </div>
        <form onSubmit={handleSend} className="chat-input">
          <input
            type="text"
            placeholder="输入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            发送
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat