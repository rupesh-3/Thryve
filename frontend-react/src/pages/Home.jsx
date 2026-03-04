import { useState, useEffect } from 'react'
import '../index.css'

// Persist each summary run to localStorage for Profile/Analysis pages
function saveToHistory(result) {
    try {
        const existing = JSON.parse(localStorage.getItem('thryve_stats') || '{"runs":0,"totalInput":0,"totalSummary":0,"history":[]}')
        const updated = {
            runs: existing.runs + 1,
            totalInput: existing.totalInput + (result.input_word_count || 0),
            totalSummary: existing.totalSummary + (result.summary_word_count || 0),
            history: [...(existing.history || []), {
                inputWords: result.input_word_count,
                summaryWords: result.summary_word_count,
                compression: result.compression_ratio,
                sentIn: result.num_sentences_in,
                sentOut: result.num_sentences_out,
            }].slice(-50),
        }
        localStorage.setItem('thryve_stats', JSON.stringify(updated))
    } catch { /* storage not available */ }
}

export default function Home() {
    const ModeIcon = ({ id, active }) => {
        const color = active ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.5)'
        const icons = {
            flash: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            ),
            brief: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="13" y2="18" />
                    <polyline points="3 6 4 7 6 5" /><polyline points="3 12 4 13 6 11" /><polyline points="3 18 4 19 6 17" />
                </svg>
            ),
            standard: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
                </svg>
            ),
            detailed: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
            ),
            full: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                </svg>
            ),
        }
        return icons[id] || null
    }

    const MODES = [
        { id: 'flash', label: 'Flash', desc: 'Single key insight' },
        { id: 'brief', label: 'Brief', desc: 'Quick overview' },
        { id: 'standard', label: 'Standard', desc: 'Balanced summary' },
        { id: 'detailed', label: 'Detailed', desc: 'In-depth coverage' },
    ]

    const [config, setConfig] = useState(() => {
        try {
            return {
                numSentences: 3, stopwordsLang: 'english', preserveOrder: true,
                minWordLen: 3, showComparison: true, showStats: true, fontSize: 'medium',
                ...JSON.parse(localStorage.getItem('thryve_config') || '{}')
            }
        } catch {
            return {
                numSentences: 3, stopwordsLang: 'english', preserveOrder: true,
                minWordLen: 3, showComparison: true, showStats: true, fontSize: 'medium'
            }
        }
    })

    const [text, setText] = useState('')
    const [selectedMode, setSelectedMode] = useState('standard')
    const [wordCount, setWordCount] = useState(0)
    const [sentenceCount, setSentenceCount] = useState(0)

    // Guaranteed-distinct sentence count per mode
    const getNumSentences = (mode, n) => {
        if (n <= 0) {
            // Unset or invalid text size fallback
            return mode === 'flash' ? 1
                : mode === 'brief' ? 2
                    : mode === 'standard' ? config.numSentences
                        : config.numSentences + 1
        }
        switch (mode) {
            case 'flash': return 1
            case 'brief': return Math.max(2, Math.ceil(n * 0.30))
            case 'standard': return Math.max(3, Math.ceil(n * 0.50))
            case 'detailed': return Math.max(4, Math.ceil(n * 0.75))
            default: return config.numSentences
        }
    }
    const numSentences = getNumSentences(selectedMode, sentenceCount)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [result, setResult] = useState(null)
    const [copied, setCopied] = useState(false)
    const [activeTab, setActiveTab] = useState('summary')

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

    useEffect(() => {
        const count = text.trim() ? text.trim().split(/\s+/).length : 0
        setWordCount(count)

        // Sentence count heuristic: split on sentence-ending punctuation
        // Matches NLTK Punkt closely for standard English prose
        const sCount = text.trim()
            ? text.trim()
                .split(/[.!?]+/)
                .map(s => s.trim())
                .filter(s => s.length > 10)
                .length
            : 0
        setSentenceCount(sCount)

    }, [text])

    const handleSubmit = async () => {
        if (wordCount < 20) {
            setError('A minimum of 20 words is required for summarization.')
            return
        }
        setLoading(true)
        setError(null)
        setResult(null)
        setCopied(false)
        setActiveTab('summary')

        try {
            const response = await fetch('https://thryve-eebw.onrender.com/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    num_sentences: numSentences,
                    language: config.stopwordsLang,
                    min_word_len: config.minWordLen,
                    preserve_order: config.preserveOrder
                }),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || `Server error (${response.status})`)
            setResult(data)
            saveToHistory(data)
        } catch (err) {
            setError(err.name === 'TypeError'
                ? 'Cannot connect to API. Ensure the Flask server is running on port 5000.'
                : err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async () => {
        if (!result?.summary) return
        try {
            await navigator.clipboard.writeText(result.summary)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            alert('Clipboard access denied.')
        }
    }

    const renderHighlightedOriginal = () => {
        if (!result?.top_sentences?.length) return text
        // Escape all special regex chars properly
        const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, (c) => '\\' + c)
        let highlighted = text
        result.top_sentences.forEach((sent) => {
            const pattern = new RegExp(escapeRegex(sent), 'g')
            highlighted = highlighted.replace(
                pattern,
                () => `<mark class="highlight-sentence">${sent}</mark>`
            )
        })
        return highlighted
    }

    const tabBtn = (id, label) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                background: activeTab === id ? 'rgba(0,240,255,0.08)' : 'transparent',
                color: activeTab === id ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${activeTab === id ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                padding: '8px 20px',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '13px',
                letterSpacing: '0.5px',
                transition: 'all 0.2s',
            }}
        >{label}</button>
    )

    return (
        <>
            <section className="hero-section">
                <div className="hero-badge">Extractive NLP · TF-IDF Scoring</div>
                <h1 className="mega-title">
                    Distill the <span>Noise.</span>
                </h1>
                <p className="hero-subtitle">
                    Advanced extractive NLP pipeline. Paste your source text and the TF-IDF engine
                    will extract the most statistically important sentences.
                </p>
            </section>

            <main className="glass-panel">
                <div className="input-header">
                    <h2 className="input-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        Input Text
                    </h2>
                    <div className={`word-counter ${wordCount > 0 && wordCount < 20 ? 'warn' : ''}`}>
                        {wordCount} words
                    </div>
                </div>

                <textarea
                    className="mega-textarea"
                    placeholder="Paste or type your source text here — minimum 20 words required."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    spellCheck={false}
                />

                {/* Summary Depth Mode Selector */}
                <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                            Summary Depth
                        </span>
                        {sentenceCount > 0 && (
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'rgba(0,240,255,0.6)', background: 'rgba(0,240,255,0.07)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '6px', padding: '2px 10px' }}>
                                {numSentences} of {sentenceCount} sentences
                            </span>
                        )}
                    </div>
                    <div className="stats-four-col" style={{ gap: '10px' }}>
                        {MODES.map(mode => {
                            const isActive = selectedMode === mode.id
                            const count = getNumSentences(mode.id, sentenceCount)
                            return (
                                <button
                                    key={mode.id}
                                    onClick={() => setSelectedMode(mode.id)}
                                    style={{
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '14px 8px',
                                        borderRadius: '14px',
                                        border: isActive
                                            ? '1.5px solid rgba(0,240,255,0.55)'
                                            : '1.5px solid rgba(255,255,255,0.07)',
                                        background: isActive
                                            ? 'linear-gradient(135deg, rgba(0,240,255,0.10), rgba(140,0,255,0.10))'
                                            : 'rgba(255,255,255,0.03)',
                                        cursor: 'pointer',
                                        transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
                                        boxShadow: isActive ? '0 0 18px rgba(0,240,255,0.12)' : 'none',
                                        transform: isActive ? 'translateY(-2px)' : 'none',
                                    }}
                                >
                                    {isActive && (
                                        <div style={{
                                            position: 'absolute', top: '7px', right: '7px',
                                            width: '6px', height: '6px',
                                            borderRadius: '50%',
                                            background: 'var(--neon-cyan)',
                                            boxShadow: '0 0 6px var(--neon-cyan)',
                                        }} />
                                    )}
                                    <ModeIcon id={mode.id} active={isActive} />
                                    <span style={{
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        letterSpacing: '0.5px',
                                        color: isActive ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.75)',
                                        transition: 'color 0.2s',
                                    }}>{mode.label}</span>
                                    <span style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '10px',
                                        color: 'rgba(255,255,255,0.35)',
                                        textAlign: 'center',
                                        lineHeight: 1.3,
                                    }}>{mode.desc}</span>

                                </button>
                            )
                        })}
                    </div>
                </div>

                <button
                    className="btn-mega"
                    onClick={handleSubmit}
                    disabled={loading || !text.trim()}
                >
                    {loading ? (
                        <><div className="spinner-mega"></div> Processing</>
                    ) : 'Run Summarization'}
                </button>
            </main>

            {error && (
                <div className="error-cyber">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                        <h4>Error</h4>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {result && !loading && (
                <section className="glass-panel result-mega">
                    {/* Stats row */}
                    {config.showStats && (
                        <div className="stats-four-col" style={{ marginBottom: '28px' }}>
                            {[
                                { label: 'Original Words', val: result.input_word_count?.toLocaleString() },
                                { label: 'Summary Words', val: result.summary_word_count?.toLocaleString() },
                                { label: 'Compression Ratio', val: `${result.compression_ratio}%` },
                                { label: 'Sentences', val: `${result.num_sentences_out} / ${result.num_sentences_in}` },
                            ].map((s, i) => (
                                <div key={i} className="stat-box">
                                    <div className="stat-label">{s.label}</div>
                                    <div className="stat-val" style={{ fontSize: '24px' }}>{s.val}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                        {tabBtn('summary', 'Summary')}
                        {config.showComparison && tabBtn('compare', 'Compare with Original')}
                    </div>

                    {/* Summary tab */}
                    {activeTab === 'summary' && (
                        <>
                            <div className="result-header">
                                <h3 className="result-title">Extracted Summary</h3>
                                <button className={`btn-cyber-copy ${copied ? 'success' : ''}`} onClick={handleCopy}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {copied
                                            ? <polyline points="20 6 9 17 4 12"></polyline>
                                            : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></>
                                        }
                                    </svg>
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                {result.top_sentences?.map((sent, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        background: 'rgba(0,240,255,0.03)',
                                        borderRadius: '10px',
                                        borderLeft: '2px solid rgba(0,240,255,0.3)',
                                    }}>
                                        <span style={{
                                            width: '6px', height: '6px',
                                            borderRadius: '50%',
                                            background: 'rgba(0,240,255,0.55)',
                                            flexShrink: 0,
                                            marginTop: '8px',
                                        }} />
                                        <span style={{
                                            fontFamily: 'var(--font-body)',
                                            color: 'rgba(255,255,255,0.88)',
                                            fontSize: config.fontSize === 'small' ? '13px' : config.fontSize === 'large' ? '18px' : '15px',
                                            lineHeight: config.fontSize === 'small' ? 1.6 : config.fontSize === 'large' ? 1.9 : 1.75,
                                        }}>{sent}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
                                Method: Extractive · TF-IDF sentence scoring · NLTK
                            </div>
                        </>
                    )}

                    {/* Comparison tab */}
                    {config.showComparison && activeTab === 'compare' && (
                        <div>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px', lineHeight: 1.5 }}>
                                Sentences with a highlighted background were extracted into the summary.
                            </p>
                            <div className="home-grid" style={{ gap: '16px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px' }}>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '14px' }}>Original Text</div>
                                    <div
                                        style={{ lineHeight: 1.8, fontSize: '14px', maxHeight: '380px', overflowY: 'auto', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)' }}
                                        dangerouslySetInnerHTML={{ __html: renderHighlightedOriginal() }}
                                    />
                                </div>
                                <div style={{ background: 'rgba(0,240,255,0.04)', borderRadius: '12px', padding: '20px', borderLeft: '3px solid rgba(0,240,255,0.25)' }}>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(0,240,255,0.6)', marginBottom: '14px' }}>Extracted Summary</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
                                        {result.top_sentences?.map((sent, i) => (
                                            <p key={i} style={{
                                                fontFamily: 'var(--font-body)', lineHeight: 1.7,
                                                fontSize: config.fontSize === 'small' ? '13px' : config.fontSize === 'large' ? '17px' : '14px',
                                                color: 'rgba(255,255,255,0.85)',
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                paddingBottom: '10px', margin: 0
                                            }}>
                                                {sent}
                                            </p>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontFamily: 'var(--font-display)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.5px' }}>
                                        {result.num_sentences_out} of {result.num_sentences_in} sentences · {result.compression_ratio}% compression
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            <style>{`
                .highlight-sentence {
                    background: rgba(0, 240, 255, 0.18);
                    color: #fff;
                    border-radius: 3px;
                    padding: 1px 2px;
                }
            `}</style>
        </>
    )
}
