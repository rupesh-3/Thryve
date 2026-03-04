import { useState, useEffect } from 'react'
import '../index.css'

const DEFAULT_CONFIG = {
    numSentences: 3,
    stopwordsLang: 'english',
    preserveOrder: true,
    minWordLen: 3,
    showComparison: true,
    showStats: true,
    fontSize: 'medium',
}

function loadConfig() {
    try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem('thryve_config') || '{}') }
    } catch {
        return { ...DEFAULT_CONFIG }
    }
}

function Toggle({ on, onChange }) {
    return (
        <div
            onClick={() => onChange(!on)}
            role="switch"
            aria-checked={on}
            tabIndex={0}
            onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onChange(!on)}
            style={{
                width: '44px', height: '26px',
                background: on ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)',
                borderRadius: '13px', position: 'relative', cursor: 'pointer',
                transition: 'background 0.25s', flexShrink: 0,
                boxShadow: on ? '0 0 10px rgba(0,240,255,0.3)' : 'none',
                outline: 'none',
            }}
        >
            <div style={{
                width: '18px', height: '18px', background: '#fff', borderRadius: '50%',
                position: 'absolute', top: '4px',
                left: on ? '22px' : '4px', transition: 'left 0.25s ease',
            }} />
        </div>
    )
}

function SectionLabel({ children }) {
    return (
        <div style={{
            fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700,
            color: 'rgba(255,255,255,0.35)', letterSpacing: '2px',
            textTransform: 'uppercase', marginBottom: '20px'
        }}>{children}</div>
    )
}

function CustomDropdown({ value, options, onChange }) {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <div style={{ position: 'relative' }} tabIndex={0} onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setIsOpen(false)
        }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%', padding: '11px 14px',
                    background: 'rgba(0,0,0,0.5)',
                    border: isOpen ? '1px solid rgba(0,240,255,0.6)' : '1px solid rgba(0,240,255,0.2)',
                    borderRadius: '8px', color: '#fff',
                    fontFamily: 'var(--font-display)', fontWeight: 600,
                    fontSize: '13px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 0 12px rgba(0,240,255,0.15)' : 'none'
                }}
            >
                {options.find(o => o.value === value)?.label || value}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    marginTop: '8px', background: 'rgba(5,5,20,0.95)',
                    border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px',
                    padding: '6px', zIndex: 50,
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                    maxHeight: '220px', overflowY: 'auto'
                }}>
                    {options.map(o => (
                        <div
                            key={o.value}
                            onClick={() => { onChange(o.value); setIsOpen(false) }}
                            style={{
                                padding: '10px 12px', borderRadius: '4px',
                                fontFamily: 'var(--font-display)', fontSize: '13px',
                                color: value === o.value ? '#fff' : 'rgba(255,255,255,0.6)',
                                background: value === o.value ? 'rgba(0,240,255,0.15)' : 'transparent',
                                cursor: 'pointer', transition: 'all 0.15s',
                                marginBottom: '2px'
                            }}
                            onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                            onMouseLeave={e => { if (value !== o.value) e.currentTarget.style.background = 'transparent' }}
                        >
                            {o.label}
                        </div>
                    ))}
                </div>
            )
            }
        </div >
    )
}

export default function Settings() {
    const [config, setConfig] = useState(loadConfig())
    const [saved, setSaved] = useState(false)

    const update = (key, val) => {
        setConfig(prev => ({ ...prev, [key]: val }))
        setSaved(false)
    }

    const saveConfig = () => {
        localStorage.setItem('thryve_config', JSON.stringify(config))
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    const resetConfig = () => {
        setConfig({ ...DEFAULT_CONFIG })
        localStorage.setItem('thryve_config', JSON.stringify(DEFAULT_CONFIG))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const cardStyle = {
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '12px',
        padding: '18px 20px',
        border: '1px solid rgba(255,255,255,0.05)',
    }

    const fieldLabel = (text, sub) => (
        <div style={{ marginBottom: '10px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px', color: '#fff', marginBottom: sub ? '3px' : '0' }}>{text}</div>
            {sub && <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{sub}</div>}
        </div>
    )

    return (
        <>
            <section className="hero-section" style={{ marginBottom: '40px' }}>
                <div className="hero-badge">NLP Configuration · Summarizer Settings</div>
                <h1 className="mega-title" style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}>
                    System <span>Config.</span>
                </h1>
                <p className="hero-subtitle">
                    Fine-tune the extractive NLP pipeline. All settings are saved locally and applied on the next summarization run.
                </p>
            </section>

            <div className="settings-grid" style={{ marginBottom: '24px' }}>

                {/* NLP Parameters */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 className="input-title" style={{ marginBottom: '24px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        NLP Parameters
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                        <div style={cardStyle}>
                            {fieldLabel('Default Sentences to Extract', 'Controls the default value of the slider on the Engine page.')}
                            <div className="slider-label" style={{ marginBottom: '8px' }}>
                                <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Value</span>
                                <span className="slider-value">{config.numSentences}</span>
                            </div>
                            <input type="range" min="1" max="10" value={config.numSentences}
                                onChange={e => update('numSentences', parseInt(e.target.value, 10))} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px', fontFamily: 'var(--font-display)' }}>
                                <span>1 — Most concise</span><span>10 — Most detailed</span>
                            </div>
                        </div>

                        <div style={cardStyle}>
                            {fieldLabel('Minimum Word Length for Scoring', 'Words shorter than this threshold are excluded from TF-IDF scoring.')}
                            <div className="slider-label" style={{ marginBottom: '8px' }}>
                                <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Value</span>
                                <span className="slider-value">{config.minWordLen} chars</span>
                            </div>
                            <input type="range" min="2" max="6" value={config.minWordLen}
                                onChange={e => update('minWordLen', parseInt(e.target.value, 10))} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px', fontFamily: 'var(--font-display)' }}>
                                <span>2 — More terms included</span><span>6 — Only strong terms</span>
                            </div>
                        </div>

                        <div style={cardStyle}>
                            {fieldLabel('Stopwords Language', 'Selects the NLTK stopword list used for term filtering during scoring.')}
                            <CustomDropdown
                                value={config.stopwordsLang}
                                onChange={val => update('stopwordsLang', val)}
                                options={['english', 'french', 'spanish', 'german', 'portuguese', 'italian'].map(l => ({
                                    value: l,
                                    label: l.charAt(0).toUpperCase() + l.slice(1)
                                }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Display Options */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 className="input-title" style={{ marginBottom: '24px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                        Display Options
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                        {[
                            { key: 'preserveOrder', label: 'Preserve Sentence Order', desc: 'Return extracted sentences in their original document order.' },
                            { key: 'showComparison', label: 'Show Comparison Tab', desc: 'Display the "Compare with Original" tab in the result panel.' },
                            { key: 'showStats', label: 'Show Statistics Row', desc: 'Show word count and compression ratio after each summarization.' },
                        ].map(({ key, label, desc }) => (
                            <div key={key} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                <div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: '#fff' }}>{label}</div>
                                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{desc}</div>
                                </div>
                                <Toggle on={config[key]} onChange={val => update(key, val)} />
                            </div>
                        ))}

                        <div style={cardStyle}>
                            {fieldLabel('Output Font Size', 'Adjusts the text size of the extracted summary output.')}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['Small', 'Medium', 'Large'].map(sz => (
                                    <button key={sz}
                                        onClick={() => update('fontSize', sz.toLowerCase())}
                                        style={{
                                            flex: 1, padding: '9px',
                                            background: config.fontSize === sz.toLowerCase() ? 'rgba(0,240,255,0.1)' : 'transparent',
                                            border: `1px solid ${config.fontSize === sz.toLowerCase() ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                            borderRadius: '8px',
                                            color: config.fontSize === sz.toLowerCase() ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.4)',
                                            cursor: 'pointer', fontFamily: 'var(--font-display)',
                                            fontWeight: 600, fontSize: '12px', letterSpacing: '0.5px',
                                            transition: 'all 0.2s'
                                        }}
                                    >{sz}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={resetConfig} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', letterSpacing: '0.5px', transition: 'all 0.2s' }}>
                    Reset to Defaults
                </button>
                <button onClick={saveConfig} style={{ padding: '12px 32px', background: saved ? 'transparent' : 'var(--gradient-main)', border: saved ? '1px solid rgba(0,255,170,0.4)' : 'none', borderRadius: '10px', color: saved ? 'var(--success-color)' : '#fff', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', transition: 'all 0.3s', boxShadow: saved ? 'none' : '0 0 20px rgba(138,43,226,0.35)' }}>
                    {saved ? 'Configuration Saved' : 'Save Configuration'}
                </button>
            </div>
        </>
    )
}
