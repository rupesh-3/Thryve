"""
Thryve NLP Pipeline — Extractive + Abstractive Summarizer
==========================================================
Extractive: NLTK Punkt + TF-IDF + Position Bias + MMR Diversity
Abstractive: Groq LLM (primary) | HuggingFace BART (fallback)
"""

import math
import os
import requests
from collections import defaultdict, Counter

import nltk
from rouge_score import rouge_scorer

try:
    from groq import Groq as GroqClient
except ImportError:
    GroqClient = None

# ── NLTK data ─────────────────────────────────────────────────────────────────
for _path, _pkg in [
    ("tokenizers/punkt",     "punkt"),
    ("tokenizers/punkt_tab", "punkt_tab"),
    ("corpora/stopwords",    "stopwords"),
]:
    try:
        nltk.data.find(_path)
    except LookupError:
        nltk.download(_pkg, quiet=True)

from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords as nltk_stopwords


# ══════════════════════════════════════════════════════════════════════════════
# SHARED HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _get_stop_words(language: str = "english") -> set:
    try:
        return set(nltk_stopwords.words(language))
    except OSError:
        return set(nltk_stopwords.words("english"))


def _clean_tokens(sentence: str, stop_words: set, min_len: int = 3) -> list:
    tokens = word_tokenize(sentence.lower())
    return [t for t in tokens if t.isalpha() and t not in stop_words and len(t) >= min_len]


def _calculate_rouge(original: str, summary: str) -> float:
    try:
        if not original.strip() or not summary.strip():
            return 0.0
        scorer = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)
        return round(scorer.score(original, summary)["rougeL"].fmeasure, 3)
    except Exception:
        return 0.0


def _build_abstractive_result(original: str, summary: str, method: str) -> dict:
    input_words   = len(original.split())
    summary_words = len(summary.split())
    compression   = max(0.0, round((1 - summary_words / max(input_words, 1)) * 100, 1))
    sents         = sent_tokenize(summary)
    return {
        "summary":            summary,
        "input_word_count":   input_words,
        "summary_word_count": summary_words,
        "compression_ratio":  compression,
        "num_sentences_in":   len(sent_tokenize(original)),
        "num_sentences_out":  len(sents),
        "top_sentences":      sents,
        "method":             method,
        "rouge_l":            _calculate_rouge(original, summary),
    }


def _empty_result() -> dict:
    return {
        "summary": "", "input_word_count": 0, "summary_word_count": 0,
        "compression_ratio": 0.0, "num_sentences_in": 0, "num_sentences_out": 0,
        "top_sentences": [], "method": "extractive-tfidf", "rouge_l": 0.0,
    }


# ══════════════════════════════════════════════════════════════════════════════
# EXTRACTIVE ENGINE — TF-IDF + Position Bias + MMR
# ══════════════════════════════════════════════════════════════════════════════

def _tfidf_scores(sentences: list, stop_words: set, min_word_len: int = 3) -> list:
    """Score sentences via mean TF-IDF over their content words."""
    n = len(sentences)
    if n == 0:
        return []

    tokenised = [_clean_tokens(s, stop_words, min_word_len) for s in sentences]

    df = defaultdict(int)
    for tokens in tokenised:
        for term in set(tokens):
            df[term] += 1

    scores = []
    for tokens in tokenised:
        if not tokens:
            scores.append(0.0)
            continue
        tf    = Counter(tokens)
        total = len(tokens)
        score = sum((c / total) * (math.log(n / (df[t] + 1)) + 1) for t, c in tf.items())
        scores.append(score / len(tf))

    return scores


def _position_bias(n: int) -> list:
    """
    Documents front-load key claims and end with conclusions.
    Give a gentle boost to the first 15 % and last 10 % of sentences.
    """
    bias = [1.0] * n
    if n <= 3:
        return bias
    head = max(1, int(n * 0.15))
    tail_start = min(n - 1, int(n * 0.90))
    for i in range(head):
        bias[i] = 1.4 - 0.4 * (i / head)          # 1.40 → 1.00
    for i in range(tail_start, n):
        t = (i - tail_start) / max(1, n - 1 - tail_start)
        bias[i] = max(bias[i], 1.0 + 0.2 * t)      # 1.00 → 1.20
    return bias


def _jaccard(a: list, b: list) -> float:
    """Token-set Jaccard similarity — proxy for sentence overlap."""
    sa, sb = set(a), set(b)
    union = sa | sb
    return len(sa & sb) / len(union) if union else 0.0


def _mmr_select(n_total: int, tokenised: list, scores: list, k: int,
                lam: float = 0.65) -> list:
    """
    Maximal Marginal Relevance:
        score = λ · relevance − (1−λ) · max_similarity_to_already_selected

    λ = 0.65 → 65 % relevance, 35 % diversity.
    Returns indices in MMR selection order.
    """
    remaining = list(range(n_total))
    selected  = []
    sel_toks  = []

    for _ in range(k):
        if not remaining:
            break
        best_idx, best_val = None, float("-inf")
        for idx in remaining:
            rel = scores[idx]
            sim = max((_jaccard(tokenised[idx], st) for st in sel_toks), default=0.0)
            val = lam * rel - (1 - lam) * sim
            if val > best_val:
                best_val, best_idx = val, idx
        selected.append(best_idx)
        sel_toks.append(tokenised[best_idx])
        remaining.remove(best_idx)

    return selected


def summarize(
    text: str,
    num_sentences: int = 3,
    language: str = "english",
    min_word_len: int = 3,
    preserve_order: bool = True,
) -> dict:
    """
    Extractive summarization with TF-IDF, position bias, and MMR diversity.

    For large documents (>50 sentences), sentence count auto-scales to ~12 %
    of the document so the summary remains meaningful.
    """
    raw_text  = text.strip()
    sentences = [s.strip() for s in sent_tokenize(raw_text) if s.strip()]
    n         = len(sentences)

    if n == 0:
        return _empty_result()

    stop_words = _get_stop_words(language)
    tokenised  = [_clean_tokens(s, stop_words, min_word_len) for s in sentences]

    # Base TF-IDF scores
    tfidf = _tfidf_scores(sentences, stop_words, min_word_len)

    # Apply position bias
    bias   = _position_bias(n)
    scores = [tfidf[i] * bias[i] for i in range(n)]

    # Adaptive k: for large docs guarantee at least 12 % coverage
    if n > 50:
        auto_k = max(num_sentences, int(n * 0.12))
        k = min(auto_k, n, 25)          # hard cap at 25 sentences
    else:
        k = max(1, min(num_sentences, n))

    # MMR selection for diverse, non-redundant coverage
    selected = _mmr_select(n, tokenised, scores, k)

    if preserve_order:
        selected = sorted(selected)     # restore document order

    top_sentences = [sentences[i] for i in selected]
    summary       = " ".join(top_sentences)

    input_words   = len(raw_text.split())
    summary_words = len(summary.split())
    compression   = max(0.0, round((1 - summary_words / max(input_words, 1)) * 100, 1))
    rouge_l       = _calculate_rouge(raw_text, summary)

    return {
        "summary":            summary,
        "input_word_count":   input_words,
        "summary_word_count": summary_words,
        "compression_ratio":  compression,
        "num_sentences_in":   n,
        "num_sentences_out":  len(top_sentences),
        "top_sentences":      top_sentences,
        "method":             "extractive-tfidf",
        "rouge_l":            rouge_l,
    }


# ══════════════════════════════════════════════════════════════════════════════
# ABSTRACTIVE ENGINE — Groq (primary) | HuggingFace (fallback)
# ══════════════════════════════════════════════════════════════════════════════

def _chunk_text(text: str, chunk_words: int = 1200) -> list:
    """
    Split text into chunks of ≈ chunk_words words, always breaking at sentence
    boundaries to preserve coherence.
    """
    sentences     = sent_tokenize(text)
    chunks, cur, cur_w = [], [], 0
    for sent in sentences:
        w = len(sent.split())
        if cur and cur_w + w > chunk_words:
            chunks.append(" ".join(cur))
            cur, cur_w = [sent], w
        else:
            cur.append(sent)
            cur_w += w
    if cur:
        chunks.append(" ".join(cur))
    return chunks


def _groq_call(client, model: str, text: str, target_words: int,
               max_tokens: int) -> str:
    """
    Single Groq API call.
    The prompt explicitly forbids copying sentences verbatim — the model
    must synthesise and paraphrase in its own words.
    """
    system = (
        "You are an world-class document analyst and writer. "
        "Your job is to read source text and write a completely original summary "
        "using your own words and sentence structures. "
        "STRICT RULES you must follow:\n"
        "1. DO NOT copy any sentence, phrase, or clause verbatim from the source.\n"
        "2. Paraphrase every idea — restructure, condense, and synthesise.\n"
        "3. Write in flowing, coherent paragraphs (no bullet points, no headings).\n"
        "4. Cover all major topics, arguments, and conclusions from the source.\n"
        "5. Do not add any information not present in the source.\n"
        "6. Return ONLY the summary text — nothing else."
    )
    user = (
        f"Write an original summary of the following text in approximately {target_words} words. "
        "The summary must be written entirely in your own words — "
        "paraphrase every idea, do not quote the source.\n\n"
        f"{text}"
    )
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=0.5,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content.strip()


def _adaptive_length(input_words: int) -> tuple:
    """
    Return (target_words, max_tokens) tuned to the document size.
    Rule of thumb: summary ≈ 12-15 % of source for medium docs,
                             8-10 % for very long docs.
    """
    if input_words < 300:
        return 60,  256
    elif input_words < 800:
        return 120, 512
    elif input_words < 2000:
        return 220, 900
    elif input_words < 4000:
        return 380, 1500
    elif input_words < 7000:
        return 520, 2000
    else:
        return 700, 2800


def groq_summarize(
    text: str,
    groq_api_key: str = None,
    model: str = "openai/gpt-oss-120b",
    num_sentences: int = 3,
) -> dict:
    """
    Abstractive summarization via Groq.

    Strategy:
    - Short docs (< 2 000 words): single API call with adaptive target length.
    - Long docs (≥ 2 000 words): hierarchical chunking →
        (1) summarize each 1 200-word chunk,
        (2) meta-summarize the combined chunk summaries.
    """
    if GroqClient is None:
        raise RuntimeError("The 'groq' package is not installed. Run: pip install groq")

    api_key = groq_api_key or os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "No Groq API key provided. Add GROQ_API_KEY to backend/.env or enter it in Settings."
        )

    client      = GroqClient(api_key=api_key)
    input_words = len(text.split())
    target_words, max_tokens = _adaptive_length(input_words)

    if input_words >= 2000:
        # ── Hierarchical: chunk → summarize each → meta-summarize ────────────
        chunks = _chunk_text(text, chunk_words=1200)

        # Each chunk → short intermediate summary
        chunk_summaries = []
        for chunk in chunks:
            cw, ct = _adaptive_length(len(chunk.split()))
            cs = _groq_call(client, model, chunk,
                            target_words=max(60, cw // 2),
                            max_tokens=max(256, ct // 2))
            chunk_summaries.append(cs)

        # Combine intermediate summaries and produce final output
        combined     = "\n\n".join(chunk_summaries)
        final_summary = _groq_call(client, model, combined,
                                   target_words=target_words,
                                   max_tokens=max_tokens)
    else:
        # ── Single-pass for shorter documents ─────────────────────────────────
        final_summary = _groq_call(client, model, text,
                                   target_words=target_words,
                                   max_tokens=max_tokens)

    return _build_abstractive_result(text, final_summary, method="abstractive-groq")


def abstractive_summarize_hf(
    text: str,
    hf_token: str = None,
) -> dict:
    """
    HuggingFace BART-large-CNN abstractive fallback.
    For long docs the text is chunked and chunk summaries are combined.
    """
    token = hf_token or os.environ.get("HF_TOKEN")
    if not token:
        raise ValueError(
            "No HuggingFace token provided. Add HF_TOKEN to backend/.env or Settings."
        )

    API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
    headers = {"Authorization": f"Bearer {token}"}

    input_words = len(text.split())

    # BART has a ~1024 token input limit — chunk if needed
    if input_words > 700:
        chunks = _chunk_text(text, chunk_words=600)
    else:
        chunks = [text]

    summaries = []
    for chunk in chunks:
        payload  = {"inputs": chunk, "parameters": {"max_length": 200, "min_length": 40}}
        response = requests.post(API_URL, headers=headers, json=payload, timeout=45)
        if response.status_code != 200:
            raise RuntimeError(f"HuggingFace API Error ({response.status_code}): {response.text}")
        data = response.json()
        if isinstance(data, list) and data and "summary_text" in data[0]:
            summaries.append(data[0]["summary_text"].strip())
        else:
            raise RuntimeError(f"Unexpected HF API response: {data}")

    summary = " ".join(summaries)
    return _build_abstractive_result(text, summary, method="abstractive-hf")
