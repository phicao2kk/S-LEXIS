export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { text } = body;
    const apiKey = process.env.GEMINI_KEY;

    if (!apiKey) return res.status(500).json({ error: "Thiếu GEMINI_KEY!" });

    // Sử dụng v1 ổn định
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Bạn là giám khảo IELTS. Hãy chấm điểm bài luận sau. 
            BẮT BUỘC TRẢ VỀ JSON THUẦN TÚY TRONG NHÃN CODE JSON, KHÔNG ĐƯỢC CHỨA CHỮ NÀO KHÁC:
            \`\`\`json
            {
              "band": 7.5,
              "cefr": "C1",
              "stats": {"tr": 7, "cc": 8, "lr": 7, "gra": 8},
              "suggestions": [
                {"original": "từ cũ", "replacement": "từ mới", "type": "VOCAB", "reason": "giải thích", "hint": "gợi ý"}
              ]
            }
            \`\`\`
            BÀI VIẾT: "${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.2 // Giữ cho AI trả lời nghiêm túc
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: "Lỗi Google: " + data.error.message });
    }

    // LẤY VĂN BẢN PHẢN HỒI
    let aiResponseText = data.candidates[0].content.parts[0].text;
    
    // BỘ LỌC THÔNG MINH: Tự động tìm đoạn JSON nằm giữa ```json ... ``` hoặc { ... }
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        const cleanJson = JSON.parse(jsonMatch[0]);
        res.status(200).json(cleanJson);
    } else {
        throw new Error("AI không trả về định dạng JSON chuẩn.");
    }

  } catch (error) {
    res.status(500).json({ error: "Hệ thống gặp sự cố: " + error.message });
  }
}
