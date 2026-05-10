<h1 align="center">
  <br>
  ✦ THRYVE AI
  <br>
</h1>

<h4 align="center">High-Performance Hybrid NLP Summarization Engine powered by Groq AI, React, and Flask.</h4>

<p align="center">
  <a href="#about-the-project">About The Project</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#hybrid-architecture">Architecture</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#security--optimization">Security</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%2BVite-61dafb?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/AI_Engine-Groq_Llama_3.1-f505ff?style=flat-square" alt="Groq" />
  <img src="https://img.shields.io/badge/Backend-Flask-white?style=flat-square&logo=flask" alt="Backend" />
  <img src="https://img.shields.io/badge/UI-Mega_Glassmorphism-8b5cf6?style=flat-square" alt="UI" />
</p>

---

## About The Project

**THRYVE AI** is a cutting-edge, hybrid summarization platform designed to transform massive documents into high-quality, actionable insights. By combining **Extractive statistical analysis** with **Abstractive AI synthesis**, THRYVE offers the best of both worlds: factual precision and human-like paraphrasing.

Powered by the **Groq AI LPU™ Inference Engine**, THRYVE delivers near-instant abstractive summaries using state-of-the-art models like Llama-3.1, while maintaining an offline-ready Extractive engine for local processing.

---

## Key Features

- **Hybrid Intelligence**: Toggle between **Abstractive (AI Rewrite)** and **Extractive (Sentence Selection)** modes based on your specific use case.
- **Groq AI Integration**: Ultra-fast, paraphrased summaries that synthesize complex ideas into flowing, original paragraphs.
- **Hierarchical Document Chunking**: Handles 10+ page documents with ease by intelligently breaking text into context-aware chunks for full-coverage summarization.
- **Adaptive Length Scaling**: Dynamic output length calculation ensures your summary is perfectly proportioned to the original source size.
- **MMR Diversity Scoring**: Extractive mode uses **Maximal Marginal Relevance** to ensure summaries are diverse and free from repetitive sentences.
- **Advanced History Tracking**: Searchable session history with stable Primary Keys, allowing you to filter by ID, method, or content.
- **Premium Glassmorphism UI**: A state-of-the-art, dark-mode interface with glowing neon accents and fully responsive controls.

---

## Hybrid Architecture

### 1. Frontend Logic (`/frontend-react`)
* **React 18 & Vite**: Lightning-fast UI state management.
* **Smart Navigation**: A unified dashboard for synthesis, settings, and profile analytics.
* **Local Persistence**: All API keys and user configurations are encrypted and stored in `localStorage`.
* **Dynamic Results Panel**: Tailored rendering for AI prose vs. extractive bullet points.

### 2. Intelligent Backend (`/backend`)
* **Dual-Path Pipeline**:
    * **Abstractive Path**: Orchestrates calls to **Groq AI** with an automatic fallback to **HuggingFace (BART)**.
    * **Extractive Path**: A local, TF-IDF + MMR engine using **NLTK** for privacy-first, zero-cost processing.
* **Context Preservation**: Implements position bias to prioritize critical introductions and conclusions in large documents.
* **Security Hardening**: Built-in health checks and environment sanitation for production readiness.

---

## Quick Start

### Prerequisites
* Python 3.10+
* Node.js v18+
* [Groq API Key](https://console.groq.com) (Recommended for Abstractive mode)

### 1. Launch the Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 2. Launch the Frontend
```bash
cd frontend-react
npm install
npm run dev
```

### 3. Configuration
1. Open the **Settings** page in the app.
2. Enter your **Groq API Key**.
3. Return to the **Engine** page and select **Abstractive — Groq AI ✦**.

---

## Security & Optimization

- **Zero-Leaking Environment**: Updated `.gitignore` prevents `node_modules`, `.env` files, and build artifacts from ever hitting version control.
- **High-Octane Performance**: Optimized for Render/Vercel with built-in cron-job health checks to prevent service spin-down.
- **Automated Regression Suite**: Comprehensive PyTest suite covering 45+ core NLP logic points.

---

## Credits
- **AI Models**: Llama-3.1 via [Groq](https://groq.com/).
- **NLP**: [NLTK](https://www.nltk.org/) & [Rouge-Score](https://github.com/google-research/google-research/tree/master/rouge).
- **Frontend**: [React](https://reactjs.org/) & [Vite](https://vitejs.dev/).
