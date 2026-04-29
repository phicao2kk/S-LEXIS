export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ nhận POST' });
  }

  try {
    // Ép kiểu dữ liệu sang JSON nếu Vercel không tự parse
    let body = req.body;
    if (typeof body === 'string') {
        body = JSON.parse(body);
    }

    const text = body.text; // Lấy nội dung bài viết
    const apiKey = process.env.DEEPSEEK_KEY;

    if (!text) {
      return res.status(400).json({ error: "Dữ liệu bài viết bị trống (400)" });
    }

    const dsResponse = await fetch("https://api.deepseek.com/chat/completions", {
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
            content: "Bạn là giám khảo IELTS. Phân tích bài viết và trả về JSON chuẩn: {\"band\": 7, \"cefr\": \"C1\", \"stats\": {\"tr\": 7, \"cc\": 7, \"lr\": 7, \"gra\": 7}, \"suggestions\": []}"
          },
          { role: "user", content: text }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const dsData = await dsResponse.json();

    if (!dsResponse.ok) {
        // Trả về lỗi thật từ DeepSeek (Ví dụ: hết tiền - Insufficient Balance)
        return res.status(dsResponse.status).json({ error: dsData.error?.message || "Lỗi AI" });
    }

    const result = JSON.parse(dsData.choices[0].message.content);
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: "Lỗi Server: " + error.message });
  }
}
