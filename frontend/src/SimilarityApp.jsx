import { useState } from "react";

export default function SimilarityApp() {
    // --- STATE TANIMLARI ---
    const [textA, setTextA] = useState("Buraya kısa bir metin girin...");
    const [textB, setTextB] = useState("Buraya karşılaştırılacak diğer metni girin...");
    const [n, setN] = useState(2);
    const [topN, setTopN] = useState(3);

    // Kısa Metin State
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    // Dosya Analizi State
    const [fileA, setFileA] = useState(null);
    const [fileB, setFileB] = useState(null);
    const [fileResult, setFileResult] = useState(null);
    const [fileLoading, setFileLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // --- API FONKSİYONLARI ---

    // 1. Dosya Karşılaştırma
    const analyzeFiles = async () => {
        if (!fileA || !fileB) {
            alert("Lütfen analiz için iki dosya seçin.");
            return;
        }

        setFileLoading(true);
        setFileResult(null);
        setErrorMsg("");

        try {
            const formData = new FormData();
            formData.append("file_a", fileA);
            formData.append("file_b", fileB);
            formData.append("n", n);
            formData.append("top_n", topN);

            const res = await fetch("http://localhost:8000/api/analyze-files/", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Sunucu hatası oluştu.");
            }

            const data = await res.json();
            setFileResult(data);
        } catch (err) {
            console.error("Hata:", err);
            setErrorMsg(err.message);
        }
        setFileLoading(false);
    };

    // 2. Kısa Metin Kontrolü
    const analyzeShort = async () => {
        setLoading(true);
        setResponse(null);
        try {
            const res = await fetch("http://localhost:8000/api/analyze-short-text/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ textA, textB, n: Number(n) }),
            });

            if (!res.ok) throw new Error("Sunucu hatası");
            const data = await res.json();
            setResponse(data);
        } catch (err) {
            console.error(err);
            alert("Analiz başarısız oldu.");
        }
        setLoading(false);
    };

    // --- STİL ---
    const containerStyle = { maxWidth: 900, margin: "40px auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#333" };
    const cardStyle = { background: "#fff", borderRadius: 12, border: "1px solid #eaeaea", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", padding: 25, marginBottom: 30 };
    const inputGroupStyle = { display: "flex", gap: 20, marginBottom: 20 };
    const labelStyle = { display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#555" };
    const inputStyle = { width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd", background: "#f9f9f9", fontSize: 14 };

    const scoreCardStyle = (color) => ({
        flex: 1, padding: 20, borderRadius: 12, background: color,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
    });

    // --- UI RENDER ---
    return (
        <div style={containerStyle}>
            <style>{`
                .custom-file-input {
                    width: 100%;
                    padding: 8px;
                    background-color: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                }
                .custom-file-input::file-selector-button {
                    margin-right: 15px;
                    border: none;
                    background-color: #2c3e50; /* Senin istediğin koyu renk */
                    padding: 8px 16px;
                    border-radius: 6px;
                    color: #fff;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.2s;
                }
                .custom-file-input::file-selector-button:hover {
                    background-color: #34495e;
                }
            `}</style>

            {/* HEADER */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", letterSpacing: "-0.5px" }}>Metin Analiz Platformu</h1>
                <p style={{ color: "#666", fontSize: 15 }}>N-Gram ve Vektör Uzayı Tabanlı Benzerlik Tespiti</p>
            </div>

            {/* === DOSYA ANALİZİ BÖLÜMÜ === */}
            <div style={cardStyle}>
                <div style={{ borderBottom: "1px solid #eee", paddingBottom: 15, marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, margin: 0, color: "#333" }}>Doküman Karşılaştırma</h2>
                </div>

                <div style={inputGroupStyle}>
                    <div style={{ flex: 0.9, marginLeft: 0, paddingRight: 15 }}>
                        <label style={labelStyle}>İlk dosya</label>
                        <input
                            type="file"
                            onChange={(e) => setFileA(e.target.files[0])}
                            accept=".pdf,.docx,.txt"
                            className="custom-file-input"
                        />
                    </div>
                    <div style={{ flex: 0.9, marginRight: 15 }}>
                        <label style={labelStyle}>İkinci dosya</label>
                        <input
                            type="file"
                            onChange={(e) => setFileB(e.target.files[0])}
                            accept=".pdf,.docx,.txt"
                            className="custom-file-input"
                        />
                    </div>
                </div>

                <div style={{ display: "flex", gap: 20, marginBottom: 25 }}>
                    <div>
                        <label style={labelStyle}>Hassasiyet (N-Gram)</label>
                        <input type="number" min="1" max="4" value={n} onChange={(e) => setN(e.target.value)} style={{ ...inputStyle, width: 80 }} />
                    </div>
                    <div>
                        <label style={labelStyle}>Eşleşme Limiti</label>
                        <input type="number" min="1" max="10" value={topN} onChange={(e) => setTopN(e.target.value)} style={{ ...inputStyle, width: 80 }} />
                    </div>
                </div>

                <button
                    onClick={analyzeFiles}
                    disabled={fileLoading}
                    style={{
                        width: "100%", padding: 16, borderRadius: 8, border: "none", fontSize: 15, fontWeight: 600,
                        background: fileLoading ? "#bdc3c7" : "#27ae60", color: "#fff", cursor: fileLoading ? "not-allowed" : "pointer",
                        transition: "0.2s"
                    }}
                >
                    {fileLoading ? "Analiz Yapılıyor..." : "Karşılaştırmayı Başlat"}
                </button>

                {errorMsg && (
                    <div style={{ marginTop: 20, padding: 15, background: "#ffecec", color: "#d63031", borderRadius: 8, fontSize: 14 }}>
                        ⚠️ <strong>Hata:</strong> {errorMsg}
                    </div>
                )}

                {/* SONUÇLAR */}
                {fileResult && (
                    <div style={{ marginTop: 40, animation: "fadeIn 0.4s" }}>

                        {/* SKOR KARTLARI */}
                        <div style={{ display: "flex", gap: 20, marginBottom: 30, flexWrap: "wrap" }}>

                            {/* 1. Global Skor */}
                            <div style={scoreCardStyle("#e3f2fd")}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#1565c0", marginBottom: 5 }}>GENEL BENZERLİK</span>
                                <span style={{ fontSize: 36, fontWeight: 800, color: "#0d47a1" }}>
                                    {(fileResult.global_similarity_score * 100).toFixed(1)}%
                                </span>
                                <span style={{ fontSize: 12, color: "#546e7a", marginTop: 5 }}>Tüm metin vektörü</span>
                            </div>

                            {/* 2. Chunked Skor (YENİ EKLENEN) */}
                            <div style={scoreCardStyle("#e8f5e9")}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#2e7d32", marginBottom: 5 }}>PARÇALI BENZERLİK</span>
                                <span style={{ fontSize: 36, fontWeight: 800, color: "#1b5e20" }}>
                                    {(fileResult.chunked_similarity_score * 100).toFixed(1)}%
                                </span>
                                <span style={{ fontSize: 12, color: "#546e7a", marginTop: 5 }}>Paragraf ortalaması</span>
                            </div>

                            {/* 3. Bilgi Kartı */}
                            <div style={scoreCardStyle("#f3f4f6")}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#616161", marginBottom: 5 }}>MATRİS BOYUTU</span>
                                <span style={{ fontSize: 24, fontWeight: 800, color: "#424242", margin: "8px 0" }}>
                                    {fileResult.matrix_shape ? `${fileResult.matrix_shape[0]} x ${fileResult.matrix_shape[1]}` : "-"}
                                </span>
                                <span style={{ fontSize: 12, color: "#757575" }}>Karşılaştırılan parça sayısı</span>
                            </div>
                        </div>

                        {/* DETAYLI EŞLEŞMELER LİSTESİ */}
                        <h3 style={{ fontSize: 16, color: "#444", borderBottom: "2px solid #eee", paddingBottom: 10, marginBottom: 20 }}>
                            🔍 En Yüksek Eşleşmeler
                        </h3>

                        {fileResult.most_similar_pairs && fileResult.most_similar_pairs.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                                {fileResult.most_similar_pairs.map((p) => (
                                    <div key={p.rank} style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden", fontSize: 13 }}>
                                        <div style={{ background: "#fcfcfc", padding: "8px 15px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <strong style={{ color: "#555" }}>Eşleşme #{p.rank}</strong>
                                            <span style={{ background: p.score > 0.7 ? "#e74c3c" : "#f1c40f", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: "bold" }}>
                                                Skor: {(p.score * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div style={{ display: "flex" }}>
                                            <div style={{ flex: 1, padding: 15, borderRight: "1px solid #eee" }}>
                                                <div style={{ fontSize: 11, fontWeight: "bold", color: "#999", marginBottom: 5 }}>DOSYA A (Parça {p.docA_part_index})</div>
                                                <p style={{ margin: 0, color: "#333", lineHeight: 1.5 }}>"{p.docA_text_snippet}"</p>
                                            </div>
                                            <div style={{ flex: 1, padding: 15, background: "#fffbeb" }}>
                                                <div style={{ fontSize: 11, fontWeight: "bold", color: "#d4ac0d", marginBottom: 5 }}>DOSYA B (Parça {p.docB_part_index})</div>
                                                <p style={{ margin: 0, color: "#333", lineHeight: 1.5 }}>"{p.docB_text_snippet}"</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: "#999", fontStyle: "italic" }}>Yüksek benzerlik gösteren parça bulunamadı.</p>
                        )}
                    </div>
                )}
            </div>

            {/* === KISA METİN TESTİ BÖLÜMÜ === */}
            <div style={{ ...cardStyle, padding: 20, background: "#fafafa", border: "1px dashed #ccc" }}>
                <h3 style={{ fontSize: 16, margin: "0 0 15px 0", color: "#555" }}>Hızlı Metin Testi (Manuel)</h3>
                <div style={{ display: "flex", gap: 15, marginBottom: 15 }}>
                    <textarea
                        value={textA} onChange={(e) => setTextA(e.target.value)}
                        style={{ ...inputStyle, height: 80, resize: "none" }}
                    />
                    <textarea
                        value={textB} onChange={(e) => setTextB(e.target.value)}
                        style={{ ...inputStyle, height: 80, resize: "none" }}
                    />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button
                        onClick={analyzeShort}
                        disabled={loading}
                        style={{ padding: "8px 20px", background: "#7f8c8d", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                    >
                        {loading ? "..." : "Hızlı Karşılaştır"}
                    </button>

                    {response && (
                        <div style={{ fontSize: 14, fontWeight: "bold", color: "#333" }}>
                            <span style={{ marginRight: 15 }}>Jaccard: <span style={{ color: "#27ae60" }}>{response.jaccard_similarity.toFixed(3)}</span></span>
                            <span>Cosine: <span style={{ color: "#2980b9" }}>{response.cosine_similarity.toFixed(3)}</span></span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}