# -*- coding: windows-1254 -*-

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import string
import io
import base64

# CORE ANALYSIS METHODS

def chunk_text_by_paragraph(text, min_char_length=30):
    """Splits text into chunks, prioritizing double newlines (paragraphs)."""

    # TODO: This splitting method is not optimal for certain long-form texts (like novels) 
    # where the original text might use single newlines for paragraphs or have short, 
    # structured chunks. Consider implementing a more robust tokenizer or heuristic 
    # that combines short chunks if they are structurally related.

    chunks = text.split('\n\n')
    if len(chunks) <= 5:
        chunks = text.split('\n')

    cleaned_chunks = [p.strip() for p in chunks if len(p.strip()) >= min_char_length]

    if not cleaned_chunks and len(text.strip()) > 0:
         return [], "Metinde {min_char_length} karakterden uzun paragraf bulunamadı."

    return cleaned_chunks, None

def aggregate_similarity(sim_matrix):
    """Calculates a balanced similarity score by averaging max matches in both directions."""
    if sim_matrix.size == 0: return 0.0

    # Find the best match for every paragraph in A against B, and vice versa
    best_A_to_B = np.max(sim_matrix, axis=1) 
    best_B_to_A = np.max(sim_matrix, axis=0) 

    return (np.mean(best_A_to_B) + np.mean(best_B_to_A)) / 2.0

def compare_documents_chunked(text1, text2, n=2, min_char_length=30):
    chunks1, err1 = chunk_text_by_paragraph(text1, min_char_length)
    chunks2, err2 = chunk_text_by_paragraph(text2, min_char_length)

    if err1 or err2:
        return 0.0, np.array([]), [], [], "Dokümanlardan biri anlamlı parçalara ayrılamadı."

    # Combine corpus to ensure identical TF-IDF feature space
    # TODO: For better weighting, the vectorizer should ideally be fit on a large, external, 
    # domain-specific corpus to establish true global term frequency (TF-IDF).
    corpus = chunks1 + chunks2
    vectorizer = TfidfVectorizer(ngram_range=(n, n))
    X = vectorizer.fit_transform(corpus)
    
    num_chunks1 = len(chunks1)
    X_A, X_B = X[:num_chunks1], X[num_chunks1:]  

    sim_matrix = cosine_similarity(X_A, X_B)
    final_score = aggregate_similarity(sim_matrix)

    return final_score, sim_matrix, chunks1, chunks2, None

def compare_documents_global(text1, text2, n=2):
    """Treats the entire text as a single vector for a holistic comparison."""
    corpus = [text1, text2]
    try:
        vectorizer = TfidfVectorizer(ngram_range=(n, n))
        X = vectorizer.fit_transform(corpus)
        sim_matrix = cosine_similarity(X[0:1], X[1:2])
        return sim_matrix[0][0], None
    except ValueError:
        return 0.0, "Global karşılaştırma hatası (metinler çok kısa olabilir)."

def get_most_similar_pairs(sim_matrix, chunksA, chunksB, top_n=3):
    results = []
    if sim_matrix.size == 0: return results

    # Use argpartition for efficiency (O(n)) instead of full sort (O(n log n))
    flat_indices = np.argpartition(sim_matrix.ravel(), -top_n)[-top_n:]

    flat_indices = flat_indices[np.argsort(sim_matrix.ravel()[flat_indices])][::-1]

    for i, flat_idx in enumerate(flat_indices):
        row, col = np.unravel_index(flat_idx, sim_matrix.shape)
        score = sim_matrix[row, col]

        if score < 0.0001: break

        results.append({
            "rank": i + 1, "score": score,
            "docA_part_index": row + 1, 
            "docB_part_index": col + 1,
            "docA_text_snippet": chunksA[row][:150] + "...",
            "docB_text_snippet": chunksB[col][:150] + "..."
        })
    return results


# SHORT TEXT UTILITIES

def get_ngrams(text, n=1):
    text = text.lower().translate(str.maketrans('', '', string.punctuation))
    tokens = text.split()
    return set([' '.join(tokens[i:i+n]) for i in range(len(tokens)-n+1)])

def jaccard_similarity_short(text1, text2, n=1):
    ngrams1, ngrams2 = get_ngrams(text1, n), get_ngrams(text2, n)
    intersection, union = len(ngrams1 & ngrams2), len(ngrams1 | ngrams2)
    return intersection / union if union != 0 else 0.0

def cosine_similarity_short(text1, text2, n=1):
    corpus = [text1, text2]
    try:
        vectorizer = CountVectorizer(ngram_range=(n, n))
        X = vectorizer.fit_transform(corpus)
        sim_matrix = cosine_similarity(X[0:1], X[1:2])
        return sim_matrix[0][0]
    except ValueError: return 0.0

# MAIN CONTROLLER FUNCTION

def run_full_analysis(docA: str, docB: str, n: int, min_chars: int, top_n: int):
    results = {}
    errors = []

    # 1. Global Analysis
    global_score, g_err = compare_documents_global(docA, docB, n=n)
    results["global_similarity_score"] = global_score
    if g_err: errors.append(g_err)

    # 2. Chunked Analysis
    chunked_score, sim_matrix, chunksA, chunksB, c_err = compare_documents_chunked(
        docA, docB, n=n, min_char_length=min_chars
    )
    
    if c_err:
        errors.append(c_err)
        results["error_message"] = ". ".join(errors)
        results["fatal_error"] = True 
        return results

    results["chunked_similarity_score"] = chunked_score
    results["matrix_shape"] = sim_matrix.shape

    # 3. Top Pairs Extraction
    most_similar = get_most_similar_pairs(sim_matrix, chunksA, chunksB, top_n=top_n)
    results["most_similar_pairs"] = most_similar
    
    results["error_message"] = ". ".join(errors) if errors else None
    results["fatal_error"] = False 

    return results