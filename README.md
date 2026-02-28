<h1 align="center">
  <br>
  ✦ THRYVE
  <br>
</h1>

<h4 align="center">Next-Gen Abstractive Text Summarisation via NLP, React, and DistilBART.</h4>

<p align="center">
  <a href="#about-the-project">About The Project</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%2BVite-61dafb?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/UI-Mega%20Glassmorphism-8b5cf6?style=flat-square" alt="UI" />
  <img src="https://img.shields.io/badge/Backend-Flask-white?style=flat-square&logo=flask" alt="Backend" />
  <img src="https://img.shields.io/badge/Model-DistilBART-orange?style=flat-square&logo=huggingface" alt="Model" />
</p>


---

## About The Project

**THRYVE** is a stunning, high-performance web application designed to generate high-quality, abstractive summaries of long text passages, articles, and documents. 

Unlike *extractive* summarisers which simply pull important sentences from the source text, an **abstractive** summariser understands the context and generates completely new, human-readable sentences.

To provide reliable, production-ready inferences, the backend is powered by Hugging Face's **DistilBART** (`sshleifer/distilbart-cnn-12-6`) transformer model, connected to a highly dynamic, immersive React visualization frontend.

---

## Architecture

The project is split into two distinct tiers connected via a secure, client-authenticated REST API:

1. **Frontend UI (`/frontend-react`)** 
   * A modern, responsive multi-page application utilizing the "Mega Design" aesthetic (heavy glassmorphism, glowing accents, mesh gradients).
   * Built with React 18, Vite, and `react-router-dom` for seamless page transitions.
   * Manages user identity and API Keys locally in the browser (`localStorage`) for public demo safety.
2. **Flask Backend (`/backend`)**
   * A lightweight Python HTTP API acting as a bridge between the frontend and the Hugging Face AI pipeline.
   * Utilises smart retry logic (exponential backoff) to gracefully handle model cold-start (503) errors.
   * Expects the API Token to be passed dynamically from the client-side, ensuring no server-side secrets are leaked.

---

## Features

- **Abstractive Summarisation**: Generates readable, coherent synopses via the Hugging Face Inference API.
- **Client-Side Security**: Users provide their own Hugging Face tokens via the **Profile** page, safely stored in their browser for secure public deployments.
- **Multi-Page Routing**: Seamlessly navigate between the core summarization Engine, global Analysis metrics, Profile settings, and System Configurations.
- **Customisable Length**: Dual sliders allow users to define exact minimum and maximum token lengths.
- **Resilient Backend**: Automatic recovery from Hugging Face cold-start API timeouts.

---

## Quick Start

To run this application locally, you will need two separate terminal windows.

### Prerequisites

* Python 3.10+
* Node.js v18+
* A [Hugging Face User Access Token](https://huggingface.co/settings/tokens)

### 1. Setup the Backend

```bash
cd backend

# Create a virtual environment and install dependencies
python -m venv venv
# On Windows: venv\\Scripts\\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Run the Flask Server
python app.py
# Runs on http://localhost:5000
```

### 2. Setup the Frontend

```bash
cd frontend-react

# Install dependencies
npm install

# Run the Vite Development Server
npm run dev
# Runs on http://localhost:5173
```

Once both servers are running, open your browser and navigate to `http://localhost:5173`. Navigate to the **Profile** tab to input your Hugging Face API key!

---

## Deployment

This app is architected cleanly to be pushed straight to production:

1. **Backend**: The `backend` folder contains a `requirements.txt` and is structured to be deployed easily on platforms like **Render**, **Heroku**, or **Railway**. Use a WSGI server like Gunicorn (`gunicorn app:app`) in production.
2. **Frontend**: The `frontend-react` folder can be compiled (`npm run build`) and deployed for free on static CDNs like **Vercel** or **Netlify**. Ensure you update the fetch URL in `/src/pages/Home.jsx` to point to your deployed backend URL.

Because the API key is entered client-side, **you can deploy this repository publicly immediately without leaking any secure tokens**.

---

## Credits

- Model Architecture based on Seq2Seq LSTM with Bahdanau (Additive) Attention
- Transformer inference provided by [Hugging Face](https://huggingface.co/) `sshleifer/distilbart-cnn-12-6`
