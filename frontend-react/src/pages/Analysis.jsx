import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import '../index.css'

function getStats() {
    try {
        return JSON.parse(localStorage.getItem('thryve_stats') || '{"runs":0,"totalInput":0,"totalSummary":0,"history":[]}')
    } catch {
        return { runs: 0, totalInput: 0, totalSummary: 0, history: [] }
    }
}

function getBarData(history) {
    const base = history.slice(-12).map(h => h.compression || 0)
    while (base.length < 12) base.unshift(0)
    return base
}

export default function Analysis() {
    const [stats, setStats] = useState(getStats())

    useEffect(() => {
        const refresh = () => setStats(getStats())
        window.addEventListener('focus', refresh)
        return () => window.removeEventListener('focus', refresh)
    }, [])

    const bars = getBarData(stats.history)

    const chartData = stats.history.slice(-15).map((h, i) => ({
        name: `Run ${Math.max(1, stats.runs - stats.history.slice(-15).length + i + 1)}`,
        compression: h.compression || 0,
        input: h.inputWords || 0,
        summary: h.summaryWords || 0
    }))

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'rgba(5,5,20,0.95)', border: '1px solid rgba(0,240,255,0.2)', padding: '10px', borderRadius: '8px', backdropFilter: 'blur(10px)', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                    <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontFamily: 'var(--font-display)', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ margin: '4px 0', color: entry.color, fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                            {entry.name}: <span style={{ fontFamily: 'var(--font-display)', color: '#fff' }}>{entry.value}{entry.name === 'Compression' ? '%' : ''}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const avgCompression = stats.runs > 0
        ? Math.round((1 - stats.totalSummary / Math.max(stats.totalInput, 1)) * 100)
        : 0

    const totalSentExtracted = stats.history.reduce((a, h) => a + (h.sentOut || 0), 0)
    const wordsSaved = stats.totalInput - stats.totalSummary

    const shortRuns = stats.history.filter(h => (h.sentOut || 0) <= 2).length
    const medRuns = stats.history.filter(h => (h.sentOut || 0) >= 3 && (h.sentOut || 0) <= 5).length
    const longRuns = stats.history.filter(h => (h.sentOut || 0) > 5).length
    const totalDistr = shortRuns + medRuns + longRuns || 1

    const sectionLabel = (text) => (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>{text}</div>
    )

    return (
        <>
            <section className="hero-section" style={{ marginBottom: '40px' }}>
                <div className="hero-badge">Session Analytics · NLP Metrics</div>
                <h1 className="mega-title" style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}>
                    System <span>Analysis.</span>
                </h1>
                <p className="hero-subtitle">
                    Live metrics from your extractive NLP sessions — compression rates, word reduction, and sentence-level analysis.
                </p>
            </section>

            {/* Top Stats */}
            <div className="glass-panel" style={{ marginBottom: '24px' }}>
                <div className="input-header" style={{ marginBottom: '28px' }}>
                    <h2 className="input-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        Session Metrics
                    </h2>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-display)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Current Session</span>
                </div>

                <div className="stats-four-col">
                    {[
                        { label: 'Summaries Run', val: stats.runs, color: 'var(--neon-cyan)' },
                        { label: 'Words Compressed', val: wordsSaved > 0 ? wordsSaved.toLocaleString() : '—', color: 'var(--neon-purple)' },
                        { label: 'Avg Compression', val: stats.runs > 0 ? `${avgCompression}%` : '—', color: 'var(--neon-pink)' },
                        { label: 'Sentences Extracted', val: totalSentExtracted || '—', color: 'var(--success-color)' },
                    ].map((s, i) => (
                        <div key={i} className="stat-box">
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-val" style={{ color: s.color, fontSize: '28px' }}>{s.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recharts Graphs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px', marginBottom: '24px' }}>

                {/* Graph 1: Compression Rate AreaChart */}
                <div className="glass-panel" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
                    {sectionLabel('Compression Rate History')}
                    {stats.runs === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>Run summaries to populate chart</span>
                        </div>
                    ) : (
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--neon-cyan)" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="var(--neon-cyan)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="rgba(255,255,255,0.3)"
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'var(--font-display)' }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.3)"
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'var(--font-display)' }}
                                        axisLine={false}
                                        tickLine={false}
                                        domain={[0, 100]}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="compression" name="Compression" stroke="var(--neon-cyan)" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" activeDot={{ r: 6, fill: 'var(--neon-cyan)', stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Graph 2: Input vs Summary Words BarChart */}
                <div className="glass-panel" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
                    {sectionLabel('Words Reduction Comparison')}
                    {stats.runs === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>Run summaries to populate chart</span>
                        </div>
                    ) : (
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="rgba(255,255,255,0.3)"
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'var(--font-display)' }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.3)"
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'var(--font-display)' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                    <Legend wrapperStyle={{ fontFamily: 'var(--font-display)', fontSize: '12px', paddingTop: '10px' }} />
                                    <Bar dataKey="input" name="Input Words" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="summary" name="Summary Words" fill="var(--neon-purple)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

        </>
    )
}
