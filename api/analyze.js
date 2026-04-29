// api/analyze.js
export default async function handler(req, res) {
  // Chỉ cho phép phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = JSON.parse(req.body);
  const apiKey = process.env.DEEPSEEK_KEY; // Key này lấy từ cấu hình Vercel, không nằm trong code

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Bạn là một chuyên gia chấm điểm IELTS chuyên nghiệp. Hãy phân tích bài viết người dùng cung cấp.
            TRẢ VỀ KẾT QUẢ DUY NHẤT DƯỚI DẠNG JSON (KHÔNG KÈM MARKDOWN) CÓ CẤU TRÚC SAU:
            {
              "band": 7.5,
              "cefr": "C1",
              "stats": {"tr": 7, "cc": 8, "lr": 7, "gra": 8},
              "suggestions": [
                {"original": "từ_cũ", "replacement": "từ_mới", "type": "VOCAB", "reason": "giải thích", "hint": "gợi ý"},
                ...
              ]
            }`
          },
          { role: "user", content: text }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    // Trả kết quả từ DeepSeek về cho giao diện web
    res.status(200).json(JSON.parse(data.choices[0].message.content));
  } catch (error) {
    res.status(500).json({ error: "Lỗi kết nối AI" });
  }
}