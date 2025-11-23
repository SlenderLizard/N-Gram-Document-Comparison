from pydantic import BaseModel
from typing import List, Optional, Tuple

class ShortTextRequest(BaseModel):
    textA: str
    textB: str
    n: int = 1

class ShortTextResponse(BaseModel):
    jaccard_similarity: float
    cosine_similarity: float

class MostSimilarPair(BaseModel):
    rank: int
    score: float
    docA_part_index: int
    docB_part_index: int
    docA_text_snippet: str
    docB_text_snippet: str

class AnalysisResponse(BaseModel):
    global_similarity_score: float
    chunked_similarity_score: float
    matrix_shape: Tuple[int, int]
    most_similar_pairs: List[MostSimilarPair]
    error_message: Optional[str]

