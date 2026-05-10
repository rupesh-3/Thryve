"""
Regression Tests — Flask API Integration Tests
===============================================
Run with:  python -m pytest tests/ -v --tb=short
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
import json
from app import app as flask_app

SAMPLE_TEXT = (
    "Artificial intelligence is transforming industries across the globe. "
    "Machine learning algorithms can now detect diseases earlier than human doctors. "
    "Natural language processing enables computers to understand and generate human text. "
    "Self-driving cars use computer vision to navigate complex environments safely. "
    "AI is also being applied to climate modelling to predict weather patterns more accurately. "
    "Researchers warn that ethical guidelines must keep pace with technological advances. "
    "Governments worldwide are racing to establish regulatory frameworks for AI. "
    "Despite concerns, most experts believe AI will create more jobs than it destroys. "
    "Education systems must adapt to prepare students for an AI-augmented workforce. "
    "The next decade will be defined by how humanity chooses to govern these technologies."
)


@pytest.fixture
def client():
    flask_app.config["TESTING"] = True
    with flask_app.test_client() as c:
        yield c


# ── Health check ─────────────────────────────────────────────────────────────

class TestHealthEndpoint:
    def test_health_returns_200(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200

    def test_health_json_shape(self, client):
        resp = client.get("/api/health")
        data = resp.get_json()
        assert "status" in data
        assert data["status"] == "ok"
        assert "extractive_engine" in data
        assert "abstractive_engine" in data

    def test_health_correct_extractive_engine(self, client):
        resp = client.get("/api/health")
        assert resp.get_json()["extractive_engine"] == "nltk-tfidf"


# ── Successful summarization ──────────────────────────────────────────────────

class TestSummarizeSuccess:
    def test_extractive_returns_200(self, client):
        resp = client.post(
            "/api/summarize",
            json={"text": SAMPLE_TEXT, "method": "extractive", "num_sentences": 3},
        )
        assert resp.status_code == 200

    def test_extractive_response_keys(self, client):
        resp = client.post("/api/summarize", json={"text": SAMPLE_TEXT})
        data = resp.get_json()
        for key in ["summary", "input_word_count", "summary_word_count",
                    "compression_ratio", "num_sentences_in", "num_sentences_out",
                    "top_sentences", "method", "rouge_l"]:
            assert key in data, f"Missing key: {key}"

    def test_extractive_method_label(self, client):
        resp = client.post("/api/summarize", json={"text": SAMPLE_TEXT})
        assert resp.get_json()["method"] == "extractive-tfidf"

    def test_num_sentences_respected(self, client):
        resp = client.post(
            "/api/summarize",
            json={"text": SAMPLE_TEXT, "num_sentences": 2},
        )
        assert resp.get_json()["num_sentences_out"] == 2

    def test_compression_ratio_valid(self, client):
        resp = client.post("/api/summarize", json={"text": SAMPLE_TEXT})
        ratio = resp.get_json()["compression_ratio"]
        assert 0.0 <= ratio <= 100.0

    def test_rouge_l_valid(self, client):
        resp = client.post("/api/summarize", json={"text": SAMPLE_TEXT})
        rouge = resp.get_json()["rouge_l"]
        assert 0.0 <= rouge <= 1.0


# ── Validation errors ────────────────────────────────────────────────────────

class TestValidationErrors:
    def test_missing_text_field_returns_400(self, client):
        resp = client.post("/api/summarize", json={"num_sentences": 3})
        assert resp.status_code == 400
        assert "error" in resp.get_json()

    def test_empty_body_returns_400(self, client):
        resp = client.post(
            "/api/summarize",
            data="not json",
            content_type="application/json",
        )
        assert resp.status_code == 400

    def test_too_short_text_returns_400(self, client):
        resp = client.post("/api/summarize", json={"text": "Too short."})
        assert resp.status_code == 400
        body = resp.get_json()
        assert "error" in body
        assert "20" in body["error"]  # error mentions 20-word minimum

    def test_whitespace_only_text_returns_400(self, client):
        resp = client.post("/api/summarize", json={"text": "   "})
        assert resp.status_code == 400


# ── Parameter coercion ───────────────────────────────────────────────────────

class TestParameterCoercion:
    def test_invalid_num_sentences_coerced(self, client):
        resp = client.post(
            "/api/summarize",
            json={"text": SAMPLE_TEXT, "num_sentences": "abc"},
        )
        # Should not crash — defaults to 3
        assert resp.status_code == 200

    def test_num_sentences_too_large_clamped(self, client):
        resp = client.post(
            "/api/summarize",
            json={"text": SAMPLE_TEXT, "num_sentences": 999},
        )
        data = resp.get_json()
        assert resp.status_code == 200
        assert data["num_sentences_out"] <= data["num_sentences_in"]

    def test_num_sentences_zero_returns_one(self, client):
        resp = client.post(
            "/api/summarize",
            json={"text": SAMPLE_TEXT, "num_sentences": 0},
        )
        data = resp.get_json()
        assert resp.status_code == 200
        assert data["num_sentences_out"] >= 1

    def test_invalid_min_word_len_coerced(self, client):
        resp = client.post(
            "/api/summarize",
            json={"text": SAMPLE_TEXT, "min_word_len": "xyz"},
        )
        assert resp.status_code == 200


# ── Abstractive without key → graceful 400 ───────────────────────────────────

class TestAbstractiveNoKey:
    def test_abstractive_no_key_returns_error(self, client, monkeypatch):
        # Remove both keys from environment
        monkeypatch.delenv("GROQ_API_KEY", raising=False)
        monkeypatch.delenv("HF_TOKEN", raising=False)
        resp = client.post(
            "/api/summarize",
            json={"text": SAMPLE_TEXT, "method": "abstractive"},
        )
        # Should return 400 with a clear error, not a 500
        assert resp.status_code == 400
        body = resp.get_json()
        assert "error" in body
        # Error should mention API key
        assert "key" in body["error"].lower() or "token" in body["error"].lower()
