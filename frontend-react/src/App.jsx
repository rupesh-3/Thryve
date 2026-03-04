import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './index.css'

// Page Components
import Home from './pages/Home'
import Analysis from './pages/Analysis'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

function App() {

  // Global Mouse tracking for the background across all routes
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      document.documentElement.style.setProperty('--mouse-x', x)
      document.documentElement.style.setProperty('--mouse-y', y)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <BrowserRouter>
      {/* ── Video Background ─────────────────────────────────────────── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          zIndex: -2,
          pointerEvents: 'none',
        }}
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay for readability */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        background: 'rgba(0, 0, 0, 0.60)',
        zIndex: -1,
        pointerEvents: 'none',
      }} />

      <div className="app-wrapper">
        {/* PERSISTENT TOP NAVIGATION BAR */}
        <nav className="mega-nav">
          <NavLink to="/" className="brand" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
            <div className="logo-container">
              <img src="/THRYVE.svg" alt="THRYVE Logo" />
            </div>
            <span className="brand-name">THRYVE</span>
          </NavLink>

          <div className={`nav-links ${menuOpen ? 'mobile-open' : ''}`}>
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={() => setMenuOpen(false)}>
              Engine
            </NavLink>
            <NavLink to="/analysis" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={() => setMenuOpen(false)}>
              Analysis
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={() => setMenuOpen(false)}>
              Profile
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={() => setMenuOpen(false)}>
              Config
            </NavLink>
          </div>

          <div className="nav-controls">
            <div className="nav-status">Online</div>
            <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* PAGE ROUTING */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
