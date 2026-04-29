export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { text } = body;
    const apiKey = process.env.GEMINI_KEY;

    if (!apiKey) return res.status(500).json({ error: "Thiếu GEMINI_KEY!" });

    // SỬ DỤNG MODEL GEMINI-PRO (ỔN ĐỊNH 100%)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Bạn là một giám khảo IELTS chuyên nghiệp. Hãy chấm điểm bài luận dưới đây.
            YÊU CẦU TRẢ VỀ JSON THUẦN TÚY (KHÔNG KÈM MARKDOWN):
            {
              "band": 7.5,
              "cefr": "C1",
              "stats": {"tr": 7, "cc": 8, "lr": 7, "gra": 8},
              "suggestions": [
                {"original": "từ cũ", "replacement": "từ mới", "type": "VOCAB", "reason": "giải thích", "hint": "gợi ý"}
              ]
            }
            BÀI VIẾT CỦA THÍ SINH: "${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          // Lưu ý: Gemini Pro 1.0 đôi khi không hiểu responseMimeType, 
          // nên chúng ta sẽ dùng kỹ thuật bóc tách JSON thủ công bên dưới.
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: "Lỗi Google: " + data.error.message });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ error: "AI từ chối trả lời (Nội dung nhạy cảm)." });
    }

    const aiResponseText = data.candidates[0].content.parts[0].text;
    
    // BỘ LỌC JSON SIÊU CẤP (Tìm nội dung nằm giữa { và })
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        res.status(200).json(JSON.parse(jsonMatch[0]));
    } else {
        res.status(500).json({ error: "AI trả về định dạng không phải JSON: " + aiResponseText });
    }

  } catch (error) {
    res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
  }
}
