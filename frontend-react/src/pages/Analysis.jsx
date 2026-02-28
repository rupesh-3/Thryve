import '../index.css'

export default function Analysis() {
    return (
        <>
            <section className="hero-section" style={{ marginBottom: '40px' }}>
                <h1 className="mega-title" style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}>
                    System <span>Analysis.</span>
                </h1>
                <p className="hero-subtitle">
                    Review your lifetime summarization metrics and global efficiency tracking.
                </p>
            </section>

            <main className="glass-panel" style={{ padding: '0' }}>

                {/* TOP LEVEL STATS */}
                <div style={{ padding: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="input-header" style={{ marginBottom: '30px' }}>
                        <h2 className="input-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            Global Pulse
                        </h2>
                    </div>

                    <div className="stats-mega">
                        <div className="stat-box" style={{ borderColor: 'rgba(0, 240, 255, 0.3)' }}>
                            <div className="stat-label">Total Documents Processed</div>
                            <div className="stat-val" style={{ color: 'var(--neon-cyan)' }}>1,492</div>
                        </div>
                        <div className="stat-box" style={{ borderColor: 'rgba(138, 43, 226, 0.3)' }}>
                            <div className="stat-label">Words Compressed</div>
                            <div className="stat-val" style={{ color: 'var(--neon-purple)' }}>4.2M</div>
                        </div>
                        <div className="stat-box" style={{ borderColor: 'rgba(255, 0, 127, 0.3)' }}>
                            <div className="stat-label">Est. Time Saved</div>
                            <div className="stat-val" style={{ color: 'var(--neon-pink)' }}>284 hrs</div>
                        </div>
                    </div>
                </div>

                {/* MOCK CHART AREA */}
                <div style={{ padding: '40px' }}>
                    <h3 className="stat-label" style={{ marginBottom: '20px' }}>Activity Over Last 30 Days (Tokens/Day)</h3>

                    <div style={{
                        height: '200px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '20px',
                        gap: '12px'
                    }}>
                        {/* Generating fake CSS chart bars */}
                        {[40, 60, 45, 80, 50, 90, 100, 70, 60, 30, 85, 95].map((h, i) => (
                            <div key={i} style={{
                                flex: 1,
                                height: `${h}%`,
                                background: 'linear-gradient(to top, var(--neon-purple), var(--neon-cyan))',
                                borderRadius: '4px',
                                opacity: 0.8,
                                transition: '0.3s',
                            }}
                                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                                onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}
                            ></div>
                        ))}
                    </div>
                </div>

            </main>
        </>
    )
}
