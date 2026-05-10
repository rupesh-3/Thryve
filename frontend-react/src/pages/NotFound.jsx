import { NavLink } from 'react-router-dom'
import '../index.css'

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center'
        }}>
            <div className="hero-badge" style={{ marginBottom: '16px' }}>Error 404</div>
            <h1 className="mega-title" style={{ fontSize: 'clamp(48px, 10vw, 96px)', marginBottom: '16px' }}>
                Lost in <span>Space.</span>
            </h1>
            <p className="hero-subtitle" style={{ marginBottom: '40px' }}>
                The page you are looking for does not exist or has been moved.
            </p>
            <NavLink to="/" className="btn-mega" style={{ width: 'auto', padding: '16px 32px' }}>
                Return to Engine
            </NavLink>
        </div>
    )
}
