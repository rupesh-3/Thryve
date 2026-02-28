import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from summarizer import summarize
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow requests from the frontend


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "model": "sshleifer/distilbart-cnn-12-6"})


@app.route("/api/summarize", methods=["POST"])
def summarize_text():
    """
    Summarize the provided text.

    Expected JSON body:
        {
            "text":       <string>   (required),
            "min_length": <int>      (optional, default 30),
            "max_length": <int>      (optional, default 130)
        }

    Returns JSON:
        {
            "summary":             <string>,
            "input_word_count":    <int>,
            "summary_word_count":  <int>,
            "compression_ratio":   <float>,
            "model":               <string>
        }
    """
    data = request.get_json(silent=True)

    if not data or "text" not in data:
        return jsonify({"error": "Request body must contain a 'text' field."}), 400

    text = data["text"].strip()
    if len(text.split()) < 20:
        return jsonify({"error": "Please provide at least 20 words for a meaningful summary."}), 400

    hf_token = data.get("hf_token", "").strip()
    if not hf_token:
        return jsonify({"error": "Hugging Face API token is missing. Please set it in your Profile."}), 400

    min_length = int(data.get("min_length", 30))
    max_length = int(data.get("max_length", 130))

    # Sliders are in words; clamp to safe word ranges first
    min_length = max(10, min(min_length, 200))
    max_length = max(min_length + 10, min(max_length, 500))

    # Convert words → tokens for the HF API (BART tokenises ~1.35 tokens per word)
    WORD_TO_TOKEN = 1.35
    min_tokens = int(min_length * WORD_TO_TOKEN)
    max_tokens = int(max_length * WORD_TO_TOKEN)

    try:
        result = summarize(text, token=hf_token, min_length=min_tokens, max_length=max_tokens)
        return jsonify(result)
    except EnvironmentError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()          # prints full trace to Flask terminal
        return jsonify({"error": f"Summarization failed: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    print(f"🚀  Abstractive Text Summariser API running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
