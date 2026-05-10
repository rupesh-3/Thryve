"""
Regression Tests — NLP Summarizer Unit Tests
=============================================
Run with:  python -m pytest tests/ -v --tb=short
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from summarizer import (
    summarize,
    _calculate_rouge,
    _build_abstractive_result,
    _empty_result,
)

# ── Shared fixtures ──────────────────────────────────────────────────────────

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

SHORT_TEXT = "This is too short."

# ── Unit Tests ───────────────────────────────────────────────────────────────

class TestExtractiveBasic:
    """Core extractive summarization correctness."""

    def test_returns_expected_keys(self):
        result = summarize(SAMPLE_TEXT, num_sentences=3)
        required_keys = {
            "summary", "input_word_count", "summary_word_count",
            "compression_ratio", "num_sentences_in", "num_sentences_out",
            "top_sentences", "method", "rouge_l",
        }
        assert required_keys.issubset(result.keys()), \
            f"Missing keys: {required_keys - result.keys()}"

    def test_method_label(self):
        result = summarize(SAMPLE_TEXT)
        assert result["method"] == "extractive-tfidf"

    def test_summary_is_string(self):
        result = summarize(SAMPLE_TEXT)
        assert isinstance(result["summary"], str)
        assert len(result["summary"]) > 0

    def test_top_sentences_is_list(self):
        result = summarize(SAMPLE_TEXT, num_sentences=3)
        assert isinstance(result["top_sentences"], list)
        assert len(result["top_sentences"]) >= 1


class TestSentenceCountClamping:
    """num_sentences is clamped to available sentences."""

    def test_exact_count_returned(self):
        result = summarize(SAMPLE_TEXT, num_sentences=3)
        assert result["num_sentences_out"] == 3

    def test_count_clamped_to_max(self):
        # Request more sentences than the text has
        result = summarize(SAMPLE_TEXT, num_sentences=100)
        assert result["num_sentences_out"] <= result["num_sentences_in"]

    def test_count_minimum_is_one(self):
        result = summarize(SAMPLE_TEXT, num_sentences=0)
        assert result["num_sentences_out"] >= 1

    def test_single_sentence_flash_mode(self):
        result = summarize(SAMPLE_TEXT, num_sentences=1)
        assert result["num_sentences_out"] == 1
        assert len(result["top_sentences"]) == 1


class TestMinWordLen:
    """min_word_len filtering affects scoring (soft test — no crash)."""

    def test_min_word_len_2(self):
        result = summarize(SAMPLE_TEXT, min_word_len=2)
        assert result["num_sentences_out"] >= 1

    def test_min_word_len_6(self):
        result = summarize(SAMPLE_TEXT, min_word_len=6)
        assert result["num_sentences_out"] >= 1


class TestCompressionRatio:
    """Compression ratio is always a valid percentage."""

    def test_compression_in_range(self):
        result = summarize(SAMPLE_TEXT, num_sentences=3)
        assert 0.0 <= result["compression_ratio"] <= 100.0

    def test_compression_is_float(self):
        result = summarize(SAMPLE_TEXT)
        assert isinstance(result["compression_ratio"], float)

    def test_summary_shorter_than_input(self):
        result = summarize(SAMPLE_TEXT, num_sentences=2)
        assert result["summary_word_count"] <= result["input_word_count"]


class TestPreserveOrder:
    """Preserve-order flag controls sentence ordering."""

    def test_preserve_order_true(self):
        result = summarize(SAMPLE_TEXT, num_sentences=3, preserve_order=True)
        # top_sentences should appear in the same relative order as in SAMPLE_TEXT
        positions = [SAMPLE_TEXT.find(s) for s in result["top_sentences"]]
        assert positions == sorted(positions), "Sentences not in document order"

    def test_preserve_order_false_no_crash(self):
        result = summarize(SAMPLE_TEXT, num_sentences=3, preserve_order=False)
        assert len(result["top_sentences"]) == 3


class TestEdgeCases:
    """Graceful handling of edge-case inputs."""

    def test_empty_string_returns_empty_result(self):
        result = summarize("", num_sentences=3)
        assert result["summary"] == ""
        assert result["num_sentences_out"] == 0

    def test_whitespace_only_returns_empty_result(self):
        result = summarize("   \n\t  ", num_sentences=3)
        assert result["summary"] == ""

    def test_single_sentence_input(self):
        single = "Artificial intelligence is transforming the modern world significantly."
        result = summarize(single, num_sentences=5)
        # Can only return 1 sentence since that's all there is
        assert result["num_sentences_out"] == 1


class TestRougeScore:
    """ROUGE-L calculation is correct and within bounds."""

    def test_rouge_range(self):
        result = summarize(SAMPLE_TEXT, num_sentences=3)
        assert 0.0 <= result["rouge_l"] <= 1.0

    def test_rouge_is_float(self):
        result = summarize(SAMPLE_TEXT)
        assert isinstance(result["rouge_l"], float)

    def test_calculate_rouge_same_text(self):
        score = _calculate_rouge(SAMPLE_TEXT, SAMPLE_TEXT)
        assert score == pytest.approx(1.0, abs=0.01)

    def test_calculate_rouge_empty_graceful(self):
        score = _calculate_rouge("", "")
        assert score == 0.0

    def test_calculate_rouge_partial_overlap(self):
        score = _calculate_rouge(SAMPLE_TEXT, SAMPLE_TEXT[:50])
        assert 0.0 <= score <= 1.0


class TestAbstractiveResultBuilder:
    """_build_abstractive_result helper produces correct dict shape."""

    def test_keys_present(self):
        result = _build_abstractive_result(SAMPLE_TEXT, "A short summary.", "abstractive-groq")
        required = {
            "summary", "input_word_count", "summary_word_count",
            "compression_ratio", "num_sentences_in", "num_sentences_out",
            "top_sentences", "method", "rouge_l",
        }
        assert required.issubset(result.keys())

    def test_method_preserved(self):
        result = _build_abstractive_result(SAMPLE_TEXT, "A short summary.", "abstractive-groq")
        assert result["method"] == "abstractive-groq"

    def test_compression_non_negative(self):
        result = _build_abstractive_result(SAMPLE_TEXT, "Brief.", "abstractive-hf")
        assert result["compression_ratio"] >= 0.0


class TestEmptyResult:
    """_empty_result returns a safe default structure."""

    def test_empty_result_keys(self):
        result = _empty_result()
        assert result["summary"] == ""
        assert result["num_sentences_out"] == 0
        assert result["rouge_l"] == 0.0
