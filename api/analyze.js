export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { text } = body;
    // Lưu ý: Tên biến trên Vercel bây giờ nên đặt là GEMINI_KEY
    const apiKey = process.env.GEMINI_KEY; 

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Bạn là giám khảo IELTS. Hãy phân tích bài viết này và trả về kết quả định dạng JSON thuần túy (không kèm markdown):
            {
              "band": 7.0,
              "cefr": "C1",
              "stats": {"tr": 7, "cc": 7, "lr": 7, "gra": 7},
              "suggestions": [
                {"original": "từ_cũ", "replacement": "từ_mới", "type": "VOCAB", "reason": "giải thích", "hint": "gợi ý"}
              ]
            }
            Bài viết: "${text}"`
          }]
        }]
      })
    });

    const data = await response.json();
    
    // Google Gemini trả về cấu trúc dữ liệu hơi khác một chút:
    const aiResponseText = data.candidates[0].content.parts[0].text;
    const jsonResult = JSON.parse(aiResponseText.replace(/```json|```/g, ""));
    
    res.status(200).json(jsonResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
