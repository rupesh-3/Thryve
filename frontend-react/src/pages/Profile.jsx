import { useState, useEffect } from 'react'
import '../index.css'

function getSessionStats() {
    try {
        return JSON.parse(localStorage.getItem('thryve_stats') || '{"runs":0,"totalInput":0,"totalSummary":0,"history":[]}')
    } catch {
        return { runs: 0, totalInput: 0, totalSummary: 0, history: [] }
    }
}

export default function Profile() {
    const [stats, setStats] = useState(getSessionStats())
    const [username, setUsername] = useState(() => localStorage.getItem('thryve_name') || 'Guest User')
    const [editingName, setEditingName] = useState(false)
    const [tempName, setTempName] = useState(username)
    const [cleared, setCleared] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Pagination state for history table
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 5

    // Assign stable primary keys (originalId) based on chronological order
    const historyWithIds = stats.history.map((h, i) => ({
        ...h,
        originalId: i + 1
    }))

    const filteredHistory = historyWithIds.filter(h => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
            h.summary?.toLowerCase().includes(q) || 
            h.method?.toLowerCase().includes(q) || 
            h.originalId.toString().includes(q) ||
            (h.method?.includes('abstractive') && 'abstractive'.includes(q)) ||
            (h.method?.includes('extractive') && 'extractive'.includes(q))
        )
    })

    useEffect(() => {
        const refresh = () => setStats(getSessionStats())
        window.addEventListener('focus', refresh)
        return () => window.removeEventListener('focus', refresh)
    }, [])

    const avgCompression = stats.runs > 0
        ? Math.round((1 - stats.totalSummary / Math.max(stats.totalInput, 1)) * 100)
        : 0

    const avgSentencesOut = stats.history.length > 0
        ? (stats.history.reduce((a, h) => a + (h.sentOut || 0), 0) / stats.history.length).toFixed(1)
        : '—'

    const saveName = () => {
        localStorage.setItem('thryve_name', tempName)
        setUsername(tempName)
        setEditingName(false)
    }

    const clearHistory = () => {
        localStorage.removeItem('thryve_stats')
        setStats({ runs: 0, totalInput: 0, totalSummary: 0, history: [] })
        setCleared(true)
        setTimeout(() => setCleared(false), 2500)
    }

    const initials = username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

    return (
        <>
            <section className="hero-section" style={{ marginBottom: '40px' }}>
                <div className="hero-badge">User Profile · Session Analytics</div>
                <h1 className="mega-title" style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}>
                    Your <span>Profile.</span>
                </h1>
                <p className="hero-subtitle">
                    View your summarization history, session statistics, and manage your workspace identity.
                </p>
            </section>

            <div className="profile-layout">

                {/* Identity card */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px 24px' }}>
                    <div style={{
                        width: '96px', height: '96px', borderRadius: '50%',
                        background: 'var(--gradient-main)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-display)',
                        boxShadow: 'var(--glow-purple)', color: '#fff', letterSpacing: '2px'
                    }}>
                        {initials || 'G'}
                    </div>

                    {editingName ? (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input
                                value={tempName}
                                onChange={e => setTempName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveName()}
                                autoFocus
                                style={{
                                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,240,255,0.4)',
                                    borderRadius: '8px', color: '#fff', padding: '8px 12px',
                                    fontSize: '14px', outline: 'none', width: '100%', textAlign: 'center',
                                    fontFamily: 'var(--font-display)'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={saveName} className="btn-cyber-sm">Save</button>
                                <button onClick={() => setEditingName(false)} className="btn-cyber-ghost-sm">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, textAlign: 'center', color: '#fff' }}>{username}</h3>
                            <span style={{ fontFamily: 'var(--font-display)', color: 'var(--neon-cyan)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>Local Session</span>
                            <button
                                onClick={() => { setTempName(username); setEditingName(true) }}
                                style={{ padding: '7px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '12px', transition: 'all 0.2s', letterSpacing: '0.5px' }}
                            >Edit Name</button>
                        </>
                    )}

                    <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { k: 'Engine', v: 'Hybrid (AI + Local)', vc: 'var(--neon-purple)' },
                            { k: 'Libraries', v: 'Neural LLM / NLTK', vc: '#fff' },
                            { k: 'Compute', v: 'Cloud + Edge', vc: 'var(--success-color)' },
                        ].map(({ k, v, vc }) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'var(--font-display)' }}>
                                <span style={{ color: 'rgba(255,255,255,0.35)' }}>{k}</span>
                                <span style={{ color: vc, fontWeight: 600 }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Session stats grid */}
                <div className="home-grid">
                    {[
                        { label: 'Summaries Run', val: stats.runs, color: 'var(--neon-cyan)' },
                        { label: 'Avg Compression', val: `${avgCompression}%`, color: 'var(--neon-purple)' },
                        { label: 'Total Input Words', val: stats.totalInput.toLocaleString(), color: 'var(--neon-pink)' },
                        { label: 'Avg Sentences Out', val: avgSentencesOut, color: 'var(--success-color)' },
                    ].map((s, i) => (
                        <div key={i} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                            <div className="stat-label" style={{ marginBottom: '12px', fontSize: '11px', letterSpacing: '2px' }}>{s.label}</div>
                            <div className="stat-val" style={{ color: s.color, fontSize: '32px' }}>{s.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* History Table */}
            <div className="glass-panel" style={{ marginBottom: '24px' }}>
                <div className="input-header" style={{ marginBottom: '20px' }}>
                    <h2 className="input-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        Summarization History
                    </h2>
                    <button
                        onClick={clearHistory}
                        className={`btn-cyber-danger-ghost ${cleared ? 'success' : ''}`}
                    >
                        {cleared ? 'Cleared' : 'Clear History'}
                    </button>
                </div>
                
                {stats.history.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        <input
                            type="text"
                            placeholder="Search your summaries..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            style={{
                                width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.5)',
                                border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px', color: '#fff',
                                fontFamily: 'var(--font-display)', fontSize: '13px', outline: 'none'
                            }}
                        />
                    </div>
                )}

                {filteredHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.6 }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25, display: 'block', margin: '0 auto 12px' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        No summaries recorded yet. Run your first synthesis on the Engine page.
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                        {['#', 'Input Words', 'Summary Words', 'Compression', 'Sentences', 'Method'].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...filteredHistory].reverse().slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((h, i) => {
                                        return (
                                            <tr key={h.originalId}
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-display)', fontSize: '12px' }}>{h.originalId}</td>
                                                <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.8)' }}>{h.inputWords?.toLocaleString()}</td>
                                                <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.8)' }}>{h.summaryWords?.toLocaleString()}</td>
                                                <td style={{ padding: '12px 14px' }}>
                                                    <span style={{ background: 'rgba(0,240,255,0.08)', color: 'var(--neon-cyan)', padding: '3px 10px', borderRadius: '20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12px' }}>{h.compression}%</span>
                                                </td>
                                                <td style={{ padding: '12px 14px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{h.sentOut} / {h.sentIn}</td>
                                                <td style={{ padding: '12px 14px', color: h.method?.startsWith('abstractive') ? 'var(--neon-purple)' : 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: h.method?.startsWith('abstractive') ? 700 : 400 }}>
                                                    {h.method === 'abstractive-groq' ? 'Neural AI (Abstractive)' : 
                                                     h.method === 'abstractive-hf' ? 'HuggingFace (Abstractive)' : 
                                                     'TF-IDF Extractive'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {Math.ceil(filteredHistory.length / ITEMS_PER_PAGE) > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-display)' }}>
                                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        style={{
                                            padding: '6px 12px', background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                                            color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', fontSize: '12px',
                                            transition: 'all 0.2s'
                                        }}
                                    >Previous</button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredHistory.length / ITEMS_PER_PAGE), p + 1))}
                                        disabled={currentPage === Math.ceil(filteredHistory.length / ITEMS_PER_PAGE)}
                                        style={{
                                            padding: '6px 12px', background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                                            color: currentPage === Math.ceil(filteredHistory.length / ITEMS_PER_PAGE) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                                            cursor: currentPage === Math.ceil(filteredHistory.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', fontSize: '12px',
                                            transition: 'all 0.2s'
                                        }}
                                    >Next</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

        </>
    )
}
