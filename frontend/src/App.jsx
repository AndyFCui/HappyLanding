import React from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import Search from './pages/Search'
import Chat from './pages/Chat'
import Graph from './pages/Graph'
import Documents from './pages/Documents'
import Services from './pages/Services'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <h1>HappyLanding</h1>
          <nav>
            <NavLink to="/" end>搜索</NavLink>
            <NavLink to="/chat">AI 对话</NavLink>
            <NavLink to="/graph">知识图谱</NavLink>
            <NavLink to="/documents">文档</NavLink>
            <NavLink to="/services">服务状态</NavLink>
          </nav>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<Search />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/graph" element={<Graph />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/services" element={<Services />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App