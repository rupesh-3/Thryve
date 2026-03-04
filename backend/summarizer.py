"""
Extractive Text Summarizer — NLP Pipeline
==========================================
1. Sentence tokenization   (NLTK Punkt)
2. Word tokenization & cleaning
3. Stopword removal        (NLTK stopwords corpus)
4. TF-IDF sentence scoring
5. Top-N extraction in document order
6. Metrics calculation
"""

import math
from collections import defaultdict, Counter

import nltk

# ── Ensure required NLTK data is available ────────────────────────────────────
_NLTK_NEEDED = [
    ("tokenizers/punkt",     "punkt"),
    ("tokenizers/punkt_tab", "punkt_tab"),
    ("corpora/stopwords",    "stopwords"),
]
for resource_path, package_name in _NLTK_NEEDED:
    try:
        nltk.data.find(resource_path)
    except LookupError:
        nltk.download(package_name, quiet=True)

from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords as nltk_stopwords


# ── Internal helpers ──────────────────────────────────────────────────────────

def _get_stop_words(language: str = "english") -> set[str]:
    """Return the NLTK stopword set for the given language."""
    try:
        return set(nltk_stopwords.words(language))
    except OSError:
        return set(nltk_stopwords.words("english"))


def _clean_tokens(sentence: str, stop_words: set[str], min_len: int = 3) -> list[str]:
    """
    Tokenize a sentence, lowercase, keep only alphabetic tokens
    that are not stopwords and meet the minimum length.
    """
    tokens = word_tokenize(sentence.lower())
    return [
        t for t in tokens
        if t.isalpha() and t not in stop_words and len(t) >= min_len
    ]


def _tfidf_sentence_scores(
    sentences: list[str],
    stop_words: set[str],
    min_word_len: int = 3,
) -> list[float]:
    """
    Score each sentence using TF-IDF:

    - TF  = frequency of term / total tokens in sentence  (local normalisation)
    - IDF = log(n / (df + 1)) + 1  (smoothed to avoid division-by-zero)
    - Sentence score = mean TF-IDF of all its content words
                       (mean avoids favouring longer sentences over shorter ones)

    Returns a list of float scores, one per sentence.
    """
    n = len(sentences)
    if n == 0:
        return []

    # Tokenise all sentences once
    tokenised: list[list[str]] = [
        _clean_tokens(s, stop_words, min_word_len) for s in sentences
    ]

    # Document frequency: how many sentences contain each term
    df: dict[str, int] = defaultdict(int)
    for tokens in tokenised:
        for term in set(tokens):
            df[term] += 1

    # Score each sentence
    scores: list[float] = []
    for tokens in tokenised:
        if not tokens:
            scores.append(0.0)
            continue

        tf = Counter(tokens)
        total = len(tokens)

        score = 0.0
        for term, count in tf.items():
            term_tf  = count / total                        # normalised TF
            term_idf = math.log(n / (df[term] + 1)) + 1   # smoothed IDF (denominator only)
            score   += term_tf * term_idf

        # Mean over unique content words → fair comparison across sentence lengths
        scores.append(score / len(tf))

    return scores



# ── Public API ────────────────────────────────────────────────────────────────

def summarize(
    text: str,
    num_sentences: int = 3,
    language: str = "english",
    min_word_len: int = 3,
    preserve_order: bool = True,
) -> dict:
    """
    Extractive summarization using NLTK tokenization and TF-IDF scoring.

    Parameters
    ----------
    text          : Raw input text (minimum ~20 words recommended).
    num_sentences : Number of sentences to extract (clamped to available).
    language      : Language for NLTK stopword list (default: 'english').
    min_word_len  : Minimum token length to include in scoring.

    Returns
    -------
    dict with keys:
        summary             – Extracted summary as a single string.
        input_word_count    – Word count of original text.
        summary_word_count  – Word count of extracted summary.
        compression_ratio   – Percentage of text compressed away (0–100).
        num_sentences_in    – Total sentences detected in input.
        num_sentences_out   – Number of sentences extracted.
        top_sentences       – Ordered list of extracted sentences.
        method              – Always "extractive-tfidf".
    """
    # ── 1. Sentence tokenization ─────────────────────────────────────────────
    raw_text = text.strip()
    sentences: list[str] = sent_tokenize(raw_text)

    # Remove blank / whitespace-only sentences
    sentences = [s.strip() for s in sentences if s.strip()]
    n = len(sentences)

    if n == 0:
        return _empty_result()

    # Clamp requested output to number of available sentences
    k = max(1, min(num_sentences, n))

    # ── 2. Stopword loading ───────────────────────────────────────────────────
    stop_words = _get_stop_words(language)

    # ── 3. TF-IDF scoring ────────────────────────────────────────────────────
    scores = _tfidf_sentence_scores(sentences, stop_words, min_word_len)

    # ── 4. Select top-k, restore document order (if requested) ───────────────
    # Tie-break by position (earlier sentence preferred) for deterministic output
    ranked = sorted(range(n), key=lambda i: (-scores[i], i))[:k]
    
    if preserve_order:
        selected = sorted(ranked)  # back to document order
    else:
        selected = ranked          # keep sorted by importance

    top_sentences: list[str] = [sentences[i] for i in selected]
    summary = " ".join(top_sentences)

    # ── 5. Metrics ────────────────────────────────────────────────────────────
    input_words   = len(raw_text.split())
    summary_words = len(summary.split())
    compression   = round((1 - summary_words / max(input_words, 1)) * 100, 1)
    # Guard against negative compression when summary ≥ original (k = n edge case)
    compression   = max(0.0, compression)

    return {
        "summary":            summary,
        "input_word_count":   input_words,
        "summary_word_count": summary_words,
        "compression_ratio":  compression,
        "num_sentences_in":   n,
        "num_sentences_out":  k,
        "top_sentences":      top_sentences,
        "method":             "extractive-tfidf",
    }


def _empty_result() -> dict:
    """Return a safe empty result when no sentences can be extracted."""
    return {
        "summary":            "",
        "input_word_count":   0,
        "summary_word_count": 0,
        "compression_ratio":  0.0,
        "num_sentences_in":   0,
        "num_sentences_out":  0,
        "top_sentences":      [],
        "method":             "extractive-tfidf",
    }
