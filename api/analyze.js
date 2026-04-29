export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    // 1. Đọc dữ liệu gửi lên
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { text } = body;
    const apiKey = process.env.GEMINI_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "Thiếu GEMINI_KEY trên Vercel!" });
    }

    // 2. Gọi Google Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Bạn là giám khảo IELTS. Hãy chấm điểm bài viết sau. 
            BẮT BUỘC TRẢ VỀ DẠNG JSON THUẦN TÚY, KHÔNG ĐƯỢC CHỨA CÁC KÝ TỰ LẠ, CẤU TRÚC NHƯ SAU:
            {
              "band": 7.0,
              "cefr": "C1",
              "stats": {"tr": 7, "cc": 7, "lr": 7, "gra": 7},
              "suggestions": [
                {"original": "từ_sai", "replacement": "từ_đúng", "type": "VOCAB", "reason": "giải thích", "hint": "gợi ý"}
              ]
            }
            Bài viết: "${text}"`
          }]
        }],
        // Yêu cầu AI chỉ trả về JSON
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();

    // 3. KIỂM TRA LỖI PHẢN HỒI (Tránh lỗi reading '0')
    if (!data.candidates || data.candidates.length === 0) {
        console.error("Gemini Error:", data);
        const reason = data.promptFeedback?.blockReason || "AI từ chối trả lời hoặc lỗi cấu hình.";
        return res.status(500).json({ error: "Google AI không trả về kết quả. Lý do: " + reason });
    }

    // 4. Lấy nội dung văn bản từ AI
    const aiResponseText = data.candidates[0].content.parts[0].text;
    
    // 5. Trả kết quả về cho web
    res.status(200).json(JSON.parse(aiResponseText));

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
  }
}
