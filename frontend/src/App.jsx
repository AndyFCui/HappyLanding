import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import About from '@/pages/About'
import Search from './pages/Search'
import Chat from './pages/Chat'
import Graph from './pages/Graph'
import Documents from './pages/Documents'
import Services from './pages/Services'
import DesignSystem from './pages/DesignSystem'

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/search" element={<Search />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/graph" element={<Graph />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/services" element={<Services />} />
          <Route path="/design-system" element={<DesignSystem />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App