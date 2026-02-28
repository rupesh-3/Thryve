import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useEffect } from 'react'
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

  return (
    <BrowserRouter>
      <div className="mega-background">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="app-wrapper">
        {/* PERSISTENT TOP NAVIGATION BAR */}
        <nav className="mega-nav">
          <NavLink to="/" className="brand" style={{ textDecoration: 'none' }}>
            <div className="logo-cube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <span className="brand-name">THRYVE</span>
          </NavLink>

          <div className="nav-links">
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Engine
            </NavLink>
            <NavLink to="/analysis" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Analysis
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Profile
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Config
            </NavLink>
          </div>

          <div className="nav-status">Online</div>
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
