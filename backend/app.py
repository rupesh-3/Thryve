import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from summarizer import summarize, groq_summarize, abstractive_summarize_hf
from dotenv import load_dotenv

load_dotenv()

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": [
    "https://thryve-summarizer.vercel.app",
    "http://localhost:5173",
]}})

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint — reports available engines."""
    groq_ready = bool(os.environ.get("GROQ_API_KEY"))
    hf_ready   = bool(os.environ.get("HF_TOKEN"))
    return jsonify({
        "status":             "ok",
        "extractive_engine":  "nltk-tfidf",
        "abstractive_engine": "groq" if groq_ready else ("huggingface" if hf_ready else "none"),
        "groq_ready":         groq_ready,
        "hf_ready":           hf_ready,
    })


@app.route("/api/summarize", methods=["POST"])
def summarize_text():
    """
    Unified summarization endpoint supporting extractive and abstractive modes.

    Expected JSON body:
        {
            "text":          <string>  (required, min 20 words),
            "method":        <string>  ("extractive" | "abstractive", default "extractive"),
            "num_sentences": <int>     (optional, default 3, range 1–15),
            "language":      <string>  (optional, default "english"),
            "min_word_len":  <int>     (optional, default 3, range 2–8),
            "preserve_order":<bool>    (optional, default true),
            "groq_token":    <string>  (optional override for GROQ_API_KEY),
            "hf_token":      <string>  (optional override for HF_TOKEN),
        }

    Returns JSON with keys:
        summary, input_word_count, summary_word_count, compression_ratio,
        num_sentences_in, num_sentences_out, top_sentences, method, rouge_l
    """
    data = request.get_json(silent=True)

    if not data or "text" not in data:
        return jsonify({"error": "Request body must contain a 'text' field."}), 400

    text = data["text"].strip()

    if len(text.split()) < 20:
        return jsonify({
            "error": "Please provide at least 20 words for a meaningful summary."
        }), 400

    # ── Parse & sanitise parameters ──────────────────────────────────────────
    try:
        num_sentences = int(data.get("num_sentences", 3))
        num_sentences = max(1, min(num_sentences, 15))
    except (ValueError, TypeError):
        num_sentences = 3

    language = str(data.get("language", "english")).lower().strip()

    try:
        min_word_len = int(data.get("min_word_len", 3))
        min_word_len = max(2, min(min_word_len, 8))
    except (ValueError, TypeError):
        min_word_len = 3

    preserve_order = bool(data.get("preserve_order", True))
    method         = str(data.get("method", "extractive")).lower().strip()
    groq_token     = data.get("groq_token") or None
    hf_token       = data.get("hf_token")   or None

    # ── Dispatch to the correct engine ───────────────────────────────────────
    try:
        if method == "abstractive":
            # Primary: Groq (fast, modern LLM)
            groq_key = groq_token or os.environ.get("GROQ_API_KEY")
            hf_key   = hf_token or os.environ.get("HF_TOKEN")
            
            if groq_key:
                result = groq_summarize(
                    text,
                    groq_api_key=groq_key,
                    num_sentences=num_sentences,
                )
            elif hf_key:
                # Secondary Fallback: HuggingFace (BART-large-CNN)
                log.warning("GROQ_API_KEY not set — using HuggingFace fallback")
                result = abstractive_summarize_hf(text, hf_key)
            else:
                # No keys provided at all
                return jsonify({
                    "error": "Abstractive mode requires an API Key. Please add your Groq API Key in the Settings page or as an environment variable (GROQ_API_KEY)."
                }), 400
        else:
            # Extractive TF-IDF (always local, no key needed)
            result = summarize(
                text,
                num_sentences=num_sentences,
                language=language,
                min_word_len=min_word_len,
                preserve_order=preserve_order,
            )

        log.info(
            "Summarised [%s] — in: %d words / %d sents  out: %d sents  "
            "compression: %s%%  rouge-L: %s",
            result["method"],
            result["input_word_count"],
            result["num_sentences_in"],
            result["num_sentences_out"],
            result["compression_ratio"],
            result.get("rouge_l", "n/a"),
        )
        return jsonify(result)

    except ValueError as exc:
        # Config errors (missing API key, etc.)
        log.warning("Config error: %s", exc)
        return jsonify({"error": str(exc)}), 400

    except Exception as exc:
        log.exception("Summarization error: %s", exc)
        return jsonify({"error": f"Summarization failed: {exc}"}), 500


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port       = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    log.info("Thryve NLP API — http://localhost:%d", port)
    app.run(host="0.0.0.0", port=port, debug=debug_mode, use_reloader=False)
