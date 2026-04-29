export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { text } = body;
    const apiKey = process.env.GEMINI_KEY;

    if (!apiKey) return res.status(500).json({ error: "Thiếu GEMINI_KEY trên Vercel!" });

    // CẤU HÌNH MỚI: Dùng v1beta với đường dẫn model chuẩn nhất
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Bạn là giám khảo IELTS. Hãy chấm điểm bài luận sau. 
            TRẢ VỀ JSON THUẦN TÚY TRONG NHÃN CODE JSON, KHÔNG CHỨA CHỮ NÀO KHÁC:
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
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();

    // Nếu vẫn lỗi "Not Found", ta sẽ thử model gemini-pro (bản 1.0 cực kỳ ổn định)
    if (data.error) {
       return res.status(500).json({ error: "Lỗi Google: " + data.error.message + ". Nếu vẫn không được, hãy thử đổi tên model sang 'gemini-pro' trong code." });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ error: "AI từ chối trả lời vì nội dung nhạy cảm." });
    }

    const aiResponseText = data.candidates[0].content.parts[0].text;
    res.status(200).json(JSON.parse(aiResponseText));

  } catch (error) {
    res.status(500).json({ error: "Lỗi hệ thống: " + error.message });
  }
}
