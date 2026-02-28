import '../index.css'

export default function Settings() {
    return (
        <>
            <section className="hero-section" style={{ marginBottom: '40px' }}>
                <h1 className="mega-title" style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}>
                    System <span>Config.</span>
                </h1>
                <p className="hero-subtitle">
                    Adjust model parameters, API routes, and interface variables.
                </p>
            </section>

            <main className="glass-panel">
                <div className="input-header" style={{ marginBottom: '30px' }}>
                    <h2 className="input-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Engine Parameters
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                    {/* Toggles */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '16px' }}>Hardware Acceleration</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>Enable local GPU processing if available for faster inference speeds.</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '24px', background: 'var(--neon-cyan)', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                                <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', right: '3px' }}></div>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Enabled</span>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '16px' }}>Strict Length Constraints</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>Force the model to strictly abide by min/max token limits, which may cause sentence clipping.</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                                <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: '3px' }}></div>
                            </div>
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Disabled</span>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="stat-label" style={{ marginBottom: '12px' }}>Default Summarization Model</div>
                        <select style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(0, 240, 255, 0.3)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontFamily: 'var(--font-body)',
                            outline: 'none',
                            cursor: 'pointer'
                        }}>
                            <option>facebook/bart-large-cnn</option>
                            <option>google/pegasus-xsum</option>
                            <option>t5-base</option>
                        </select>
                    </div>

                </div>

            </main>
        </>
    )
}
