import { useState, useEffect } from 'react'
import '../index.css'

export default function Profile() {
    const [token, setToken] = useState('')
    const [isRevealed, setIsRevealed] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem('hf_token')
        if (saved) setToken(saved)
    }, [])

    const handleSaveToken = (val) => {
        setToken(val)
        localStorage.setItem('hf_token', val)
    }

    return (
        <>
            <section className="hero-section" style={{ marginBottom: '40px' }}>
                <h1 className="mega-title" style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}>
                    User <span>Profile.</span>
                </h1>
                <p className="hero-subtitle">
                    Manage your credentials, API keys, and notification preferences.
                </p>
            </section>

            <main className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '40px' }}>

                {/* LEFT COMPILER - IDENTITY */}
                <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '40px' }}>
                    <div style={{
                        width: '120px', height: '120px',
                        borderRadius: '50%',
                        background: 'var(--gradient-main)',
                        margin: '0 auto 24px',
                        position: 'relative',
                        boxShadow: 'var(--glow-purple)'
                    }}>
                        <img src="https://api.dicebear.com/7.x/initials/svg?seed=User&backgroundColor=transparent" alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', textAlign: 'center', marginBottom: '8px' }}>Guest User</h3>
                    <p style={{ color: 'var(--neon-cyan)', textAlign: 'center', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '32px' }}>Public Demo Mode</p>

                    <button className="btn-mega" style={{ padding: '12px', fontSize: '14px', marginTop: '0' }}>Edit Identity</button>
                </div>

                {/* RIGHT COMPILER - CONFIG */}
                <div>
                    <div className="input-header" style={{ marginBottom: '30px' }}>
                        <h2 className="input-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Account Credentials
                        </h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="stat-label">Email Address</div>
                            <div style={{ fontSize: '18px', color: '#fff', marginTop: '4px' }}>rupesh@thryve.net</div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="stat-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>API Key (Hugging Face)</span>
                                <span style={{ color: 'var(--neon-cyan)', cursor: 'pointer' }} onClick={() => setIsRevealed(!isRevealed)}>
                                    {isRevealed ? 'Hide' : 'Reveal'}
                                </span>
                            </div>
                            <input
                                type={isRevealed ? "text" : "password"}
                                value={token}
                                onChange={(e) => handleSaveToken(e.target.value)}
                                placeholder="Enter your HF API Token (hf_...)"
                                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '18px', marginTop: '8px', padding: '4px 0', outline: 'none', fontFamily: 'monospace' }}
                            />
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="stat-label">Subscription Tier</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <div style={{ fontSize: '18px', color: '#fff' }}>THRYVE Pro</div>
                                <div style={{ padding: '6px 12px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan)', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>ACTIVE</div>
                            </div>
                        </div>

                    </div>

                </div>

            </main>
        </>
    )
}
