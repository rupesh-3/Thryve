<h1 align="center">
  <br>
  ✦ THRYVE
  <br>
</h1>

<h4 align="center">Advanced Extractive Text Summarisation via TF-IDF Scoring, React, and NLTK.</h4>

<p align="center">
  <a href="#about-the-project">About The Project</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#mobile--analytics">Mobile & Analytics</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%2BVite-61dafb?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/UI-Mega%20Glassmorphism-8b5cf6?style=flat-square" alt="UI" />
  <img src="https://img.shields.io/badge/Backend-Flask-white?style=flat-square&logo=flask" alt="Backend" />
  <img src="https://img.shields.io/badge/Analytics-Recharts-00f0ff?style=flat-square" alt="Recharts" />
</p>

---

## About The Project

**THRYVE** is a stunning, high-performance web application designed to distill complex information into concise, statistically significant summaries. 

The engine utilizes **Extractive Summarisation**, powered by a custom **TF-IDF (Term Frequency-Inverse Document Frequency)** scoring pipeline. Instead of generating new text, it identifies and extracts the most information-dense sentences directly from the source, ensuring 100% factual accuracy and zero "AI Hallucinations."

With a "Mega Design" aesthetic featuring deep glassmorphism and glowing neon accents, THRYVE provides a premium UX for researchers, students, and professionals.

---

## Architecture

The project is architected with a modern decoupled stack:

1. **Frontend UI (`/frontend-react`)** 
   * **React 18 & Vite**: Ultra-fast development and optimized production builds.
   * **Recharts Dashboard**: Professional data visualization for session compression history and word reduction metrics.
   * **Mobile-First Design**: Fully responsive UI with a custom Hamburger Navigation system for iOS and Android.
   * **Local Persistence**: Settings and session history are stored safely in `localStorage`.

2. **Flask Backend (`/backend`)**
   * **NLTK Pipeline**: Handles tokenization, sentence splitting, and stopword removal.
   * **TF-IDF Engine**: Uses `CountVectorizer` and TF-IDF transformers to score sentence importance relative to the document context.
   * **RESTful API**: Lightweight and fast endpoint for processing multi-thousand word documents in milliseconds.

---

## Features

- **Precision Extraction**: Statistical sentence scoring via TF-IDF ensures the most relevant content is always preserved.
- **Interactive Analytics**: Monitor your summarization trends with high-quality Area and Bar charts.
- **Customizable Depth**: Define exactly how much information you want (Concise, Standard, or Detailed) via pre-set modes or manual sentence count.
- **Responsive Navigation**: A slick hamburger menu ensures 100% usability on mobile devices.
- **Ultra-Fast Performance**: Local extraction logic means summaries appear in a heartbeat, with no waiting for heavy LLM inference.

---

## Mobile & Analytics

THRYVE has been optimized for the modern mobile web:
* **Glassmorphism UI**: High-end visual effects that remain performant and beautiful on mobile viewports.
* **Auto-Stacking Grids**: Dashboard metrics and config boxes automatically reflow into a clean vertical list on smaller screens.
* **Recharts Visuals**: Responsive SVG charts that scale perfectly from 4K monitors down to iPhone screens.

---

## Quick Start

### Prerequisites
* Python 3.10+
* Node.js v18+

### 1. Setup the Backend
```bash
cd backend
python -m venv venv
# Windows: venv\\Scripts\\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 2. Setup the Frontend
```bash
cd frontend-react
npm install
npm run dev
```

Visit `http://localhost:5173` to start distilling!

---

## Credits
- Built with [React](https://reactjs.org/), [Vite](https://vitejs.dev/), and [Flask](https://flask.palletsprojects.com/).
- NLP logic powered by [NLTK](https://www.nltk.org/) and [Scikit-Learn](https://scikit-learn.org/).
- Visualizations by [Recharts](https://recharts.org/).
