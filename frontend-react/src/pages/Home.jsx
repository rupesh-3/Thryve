import { useState, useEffect } from 'react'
import '../index.css'

export default function Home() {
    const [text, setText] = useState('')
    const [minTokens, setMinTokens] = useState(30)
    const [maxTokens, setMaxTokens] = useState(130)
    const [wordCount, setWordCount] = useState(0)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [result, setResult] = useState(null)
    const [copied, setCopied] = useState(false)

    // Tracker for dynamic background interactivity
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
    }, [text])

    const handleMinChange = (e) => {
        const val = parseInt(e.target.value, 10)
        setMinTokens(val)
        if (val >= maxTokens) setMaxTokens(val + 10)
    }

    const handleMaxChange = (e) => {
        const val = parseInt(e.target.value, 10)
        setMaxTokens(val)
        if (val <= minTokens) setMinTokens(val - 10)
    }

    const handleSubmit = async () => {
        if (wordCount < 20) {
            setError('System requires a minimum of 20 words for synthesis.')
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)
        setCopied(false)

        const savedToken = localStorage.getItem('hf_token')
        if (!savedToken) {
            setError('Hugging Face API token is missing. Please configure it in your Profile.')
            setLoading(false)
            return
        }

        try {
            const response = await fetch('http://localhost:5000/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    hf_token: savedToken,
                    min_length: minTokens,
                    max_length: maxTokens,
                }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || `Server fault (${response.status})`)
            setResult(data)
        } catch (err) {
            if (err.name === 'TypeError') {
                setError('Connection to hyper-node failed. Ensure Flask API is running on port 5000.')
            } else {
                setError(err.message)
            }
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
            alert("Clipboard access denied.")
        }
    }

    return (
        <>
            <section className="hero-section">
                <div className="hero-badge">Next-Gen NLP</div>
                <h1 className="mega-title">
                    Distill the <span>Noise.</span>
                </h1>
                <p className="hero-subtitle">
                    Harness the power of abstractive AI orchestration. Paste your raw data and initiate the sequence to extract pure signal.
                </p>
            </section>

            <main className="glass-panel">
                <div className="input-header">
                    <h2 className="input-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        Input Data Stream
                    </h2>
                    <div className={`word-counter ${wordCount > 0 && wordCount < 20 ? 'warn' : ''}`}>
                        Words: {wordCount}
                    </div>
                </div>

                <textarea
                    className="mega-textarea"
                    placeholder="Initialize text sequence here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    spellCheck={false}
                />

                <div className="controls-grid">
                    <div className="slider-container">
                        <div className="slider-label">
                            <span>Minimum Compression</span>
                            <span className="slider-value">{minTokens}</span>
                        </div>
                        <input type="range" min="10" max="100" value={minTokens} onChange={handleMinChange} />
                    </div>
                    <div className="slider-container">
                        <div className="slider-label">
                            <span>Maximum Expansion</span>
                            <span className="slider-value">{maxTokens}</span>
                        </div>
                        <input type="range" min="30" max="300" value={maxTokens} onChange={handleMaxChange} />
                    </div>
                </div>

                <button
                    className="btn-mega"
                    onClick={handleSubmit}
                    disabled={loading || !text.trim()}
                >
                    {loading ? (
                        <>
                            <div className="spinner-mega"></div> Synthesizing...
                        </>
                    ) : (
                        'Initiate Synthesis'
                    )}
                </button>
            </main>

            {error && (
                <div className="error-cyber">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                        <h4>System Alert</h4>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {result && !loading && (
                <section className="glass-panel result-mega">
                    <div className="result-header">
                        <h3 className="result-title">Synthesized Output</h3>
                        <button className={`btn-cyber-copy ${copied ? 'success' : ''}`} onClick={handleCopy}>
                            {copied ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    Sequenced
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                    Copy Output
                                </>
                            )}
                        </button>
                    </div>

                    <div className="abstract-content">
                        {result.summary}
                    </div>

                    <div className="stats-mega">
                        <div className="stat-box">
                            <div className="stat-label">Source Data Vol.</div>
                            <div className="stat-val">{result.input_word_count?.toLocaleString()}</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-label">Abstract Vol.</div>
                            <div className="stat-val">{result.summary_word_count?.toLocaleString()}</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-label">Efficiency Gain</div>
                            <div className="stat-val">{result.compression_ratio}%</div>
                        </div>
                    </div>
                </section>
            )}
        </>
    )
}
