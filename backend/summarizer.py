import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

MODEL_ID    = "sshleifer/distilbart-cnn-12-6"
HF_API_URL  = f"https://router.huggingface.co/hf-inference/models/{MODEL_ID}"
MAX_RETRIES = 3          # retry up to 3× on model-loading / 503 errors
RETRY_WAIT  = 8          # seconds to wait between retries


def summarize(text: str, token: str, min_length: int = 30, max_length: int = 130) -> dict:
    """
    Summarize text via the Hugging Face Inference API (raw HTTP).
    Automatically retries on model cold-start (503) and gateway errors (504).
    """

    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "inputs": text,
        "parameters": {
            "min_length": min_length,
            "max_length": max_length,
            "do_sample":   False,
        },
        "options": {
            "wait_for_model": True,   # wait for model warm-up instead of instant 503
            "use_cache":      True,
        }
    }

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(
                HF_API_URL, headers=headers, json=payload, timeout=120
            )

            # 503 = model still loading, 504 = gateway timeout — both are retryable
            if response.status_code in (503, 504):
                wait = RETRY_WAIT * attempt
                print(f"[HF] Attempt {attempt}: status {response.status_code} — waiting {wait}s …")
                time.sleep(wait)
                last_error = f"HF API status {response.status_code}"
                continue

            if response.status_code != 200:
                raise RuntimeError(
                    f"HF API error {response.status_code}: {response.text}"
                )

            data = response.json()

            # Response: [{"summary_text": "..."}]
            if isinstance(data, list) and len(data) > 0:
                summary_text = data[0].get("summary_text", "")
            elif isinstance(data, dict) and "summary_text" in data:
                summary_text = data["summary_text"]
            else:
                raise RuntimeError(f"Unexpected API response format: {data}")

            input_words   = len(text.split())
            summary_words = len(summary_text.split())
            compression   = round((1 - summary_words / max(input_words, 1)) * 100, 1)

            return {
                "summary":            summary_text,
                "input_word_count":   input_words,
                "summary_word_count": summary_words,
                "compression_ratio":  compression,
                "model":              MODEL_ID,
            }

        except requests.exceptions.Timeout:
            wait = RETRY_WAIT * attempt
            print(f"[HF] Attempt {attempt}: Request timed out — waiting {wait}s …")
            time.sleep(wait)
            last_error = "Request timed out"

    raise RuntimeError(
        f"HF API failed after {MAX_RETRIES} attempts. Last error: {last_error}. "
        "The model may be overloaded — please try again in a few seconds."
    )
