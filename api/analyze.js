export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { text } = body;
    const apiKey = process.env.GEMINI_KEY;

    if (!apiKey) return res.status(500).json({ error: "Thiếu GEMINI_KEY trên Vercel!" });

    // ĐÃ THAY ĐỔI: Chuyển v1beta thành v1 ở dòng dưới đây
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Bạn là giám khảo IELTS. Hãy chấm điểm bài luận sau. 
            TRẢ VỀ JSON THUẦN TÚY, KHÔNG ĐƯỢC CHỨA CHỮ NÀO KHÁC NGOÀI JSON:
            {
              "band": 7.5,
              "cefr": "C1",
              "stats": {"tr": 7, "cc": 8, "lr": 7, "gra": 8},
              "suggestions": [
                {"original": "từ cũ", "replacement": "từ mới", "type": "VOCAB", "reason": "giải thích", "hint": "gợi ý"}
              ]
            }
            BÀI VIẾT: "${text}"`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      })
    });

    const data = await response.json();

    // Kiểm tra lỗi từ Google
    if (data.error) {
      return res.status(500).json({ error: "Lỗi Google: " + data.error.message });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ error: "AI từ chối trả lời. Thử viết nội dung khác." });
    }

    const aiResponseText = data.candidates[0].content.parts[0].text;
    res.status(200).json(JSON.parse(aiResponseText));

  } catch (error) {
    res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
  }
}
