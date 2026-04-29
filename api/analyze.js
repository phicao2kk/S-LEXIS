export default async function handler(req, res) {
  // 1. Chỉ nhận POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. Lấy dữ liệu an toàn (Vercel tự parse nên không cần JSON.parse nữa)
    const { text } = req.body;
    const apiKey = process.env.DEEPSEEK_KEY;

    // 3. Kiểm tra xem Key đã được dán vào Vercel chưa
    if (!apiKey) {
      return res.status(500).json({ error: "Lỗi: Bạn chưa cấu hình DEEPSEEK_KEY trên Vercel!" });
    }

    // 4. Gọi sang DeepSeek
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
            content: "Bạn là chuyên gia IELTS. Phân tích bài viết và trả về JSON: {band: number, cefr: string, stats: {tr, cc, lr, gra}, suggestions: [{original, replacement, type, reason, hint}]}"
          },
          { role: "user", content: text }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Lỗi từ DeepSeek" });
    }

    // 5. Trả kết quả về cho web
    const aiResult = JSON.parse(data.choices[0].message.content);
    res.status(200).json(aiResult);

  } catch (error) {
    res.status(500).json({ error: "Server Error: " + error.message });
  }
}
