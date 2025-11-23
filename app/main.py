# -*- coding: windows-1254 -*-

import time
import io
import fitz
import docx
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import analysis_methods as analysis
from app.schemas import ShortTextRequest, ShortTextResponse, AnalysisResponse

app = FastAPI(
    title="Metin Benzerlik API",
    description="İki doküman arasındaki N-Gram tabanlı benzerliği analiz eder.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# File Extraction Logic
async def extract_text_from_upload(file: UploadFile) -> str:
    """Reads uploaded files based on MIME type and returns string content."""
    
    file_bytes = await file.read()
    content_type = file.content_type
    
    if content_type == "application/pdf":
        try:
            pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = "".join(page.get_text() for page in pdf_doc)
            pdf_doc.close()
            return text
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF dosyası okunamadı: {str(e)}")
            

    elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        try:
            stream = io.BytesIO(file_bytes)
            doc = docx.Document(stream)
            
            # Inject double newlines to ensure the downstream 'chunker' identifies paragraphs correctly
            text = "\n\n".join([para.text for para in doc.paragraphs if para.text])
            return text
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"DOCX dosyası okunamadı: {str(e)}")

    elif content_type == "text/plain":
        try: return file_bytes.decode('utf-8')
        except UnicodeDecodeError: return file_bytes.decode('windows-1254', errors='ignore')
    
    else:
        raise HTTPException(status_code=415, 
            detail=f"Desteklenmeyen dosya tipi: {content_type}. (Sadece PDF, DOCX, TXT)")


# API ENDPOINTS

@app.get("/")
def read_root():
    return {"message": "API çalışıyor. Test için /docs adresine gidin."}

@app.post("/api/analyze-files/", response_model=AnalysisResponse)
async def analyze_uploaded_files_endpoint(
    file_a: UploadFile = File(..., description="İlk doküman (.txt, .pdf, .docx)"),
    file_b: UploadFile = File(..., description="İkinci doküman (.txt, .pdf, .docx)"),
    n: int = Form(2, description="N-Gram boyutu"),
    min_chars: int = Form(30, description="Min. paragraf uzunluğu"),
    top_n: int = Form(3, description="En benzer çift sayısı")
):

    start_time = time.time()
    

    try:
        docA = await extract_text_from_upload(file_a)
        docB = await extract_text_from_upload(file_b)
    except HTTPException as he:
        raise he # 400/415 hatalarını doğrudan yansıt

    try:
        analysis_results = analysis.run_full_analysis(
            docA, docB, n=n, min_chars=min_chars, top_n=top_n
        )
        
        if analysis_results.get("fatal_error"):
            raise HTTPException(status_code=400, detail=analysis_results.get("error_message"))

        print(f"Analiz tamamlandı. Süre: {time.time() - start_time:.2f}s")
        
        return AnalysisResponse(**analysis_results)
            
    except HTTPException as he:
        
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sunucuda beklenmedik bir analiz hatası oluştu: {str(e)}")


@app.post("/api/analyze-short-text/", response_model=ShortTextResponse)
def analyze_short_text(request: ShortTextRequest):
    try:
        jaccard_score = analysis.jaccard_similarity_short(request.textA, request.textB, request.n)
        cosine_score = analysis.cosine_similarity_short(request.textA, request.textB, request.n)
        
        return ShortTextResponse(
            jaccard_similarity=jaccard_score,
            cosine_similarity=cosine_score
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sunucu hatası: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
