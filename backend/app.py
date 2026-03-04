import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from summarizer import summarize
from dotenv import load_dotenv

load_dotenv()

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "method": "extractive-tfidf", "engine": "nltk"})


@app.route("/api/summarize", methods=["POST"])
def summarize_text():
    """
    Extractive summarization endpoint.

    Expected JSON body:
        {
            "text":          <string>  (required, min 20 words),
            "num_sentences": <int>     (optional, default 3, range 1-15),
            "language":      <string>  (optional, default "english"),
            "min_word_len":  <int>     (optional, default 3, range 2-8)
        }

    Returns JSON with keys:
        summary, input_word_count, summary_word_count, compression_ratio,
        num_sentences_in, num_sentences_out, top_sentences, method
    """
    data = request.get_json(silent=True)

    if not data or "text" not in data:
        return jsonify({"error": "Request body must contain a 'text' field."}), 400

    text = data["text"].strip()

    if len(text.split()) < 20:
        return jsonify({
            "error": "Please provide at least 20 words for a meaningful summary."
        }), 400

    # Parse parameters with safe defaults and clamping
    try:
        num_sentences = int(data.get("num_sentences", 3))
        num_sentences = max(1, min(num_sentences, 15))
    except (ValueError, TypeError):
        num_sentences = 3

    language    = str(data.get("language", "english")).lower().strip()
    
    try:
        min_word_len = int(data.get("min_word_len", 3))
        min_word_len = max(2, min(min_word_len, 8))
    except (ValueError, TypeError):
        min_word_len = 3

    preserve_order = bool(data.get("preserve_order", True))

    try:
        result = summarize(
            text,
            num_sentences=num_sentences,
            language=language,
            min_word_len=min_word_len,
            preserve_order=preserve_order,
        )
        log.info(
            "Summarised — in: %d words / %d sents  out: %d sents  compression: %s%%",
            result["input_word_count"],
            result["num_sentences_in"],
            result["num_sentences_out"],
            result["compression_ratio"],
        )
        return jsonify(result)

    except Exception as exc:
        log.exception("Summarization error: %s", exc)
        return jsonify({"error": f"Summarization failed: {exc}"}), 500


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    log.info("Extractive NLP Summariser API — http://localhost:%d", port)
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
