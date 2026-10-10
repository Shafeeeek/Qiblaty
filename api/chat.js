const instructions = `أنت مساعد قبلتي. أجب بالعربية بوضوح واختصار عن العبادات والأذكار والقرآن.
لا تختلق آيات أو أحاديث أو مراجع. صرّح بعدم اليقين، واذكر اختلاف الآراء عند الحاجة.
لا تقدّم نفسك كمفتٍ، وأحل الفتاوى الشخصية المعقدة إلى أهل العلم.`;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  const messages = body?.messages;
  if (
    !Array.isArray(messages) || !messages.length || messages.length > 20 ||
    messages.some((m) =>
      !m || !["user", "assistant"].includes(m.role) ||
      typeof m.content !== "string" || !m.content.trim() ||
      m.content.length > (m.role === "user" ? 2000 : 16000)
    ) ||
    messages.at(-1).role !== "user"
  ) {
    return res.status(400).json({ error: "Invalid messages" });
  }
  if (messages.reduce((total, m) => total + m.content.length, 0) > 40000) {
    return res.status(413).json({ error: "Conversation is too long" });
  }
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
    return res.status(503).json({ error: "Assistant is not configured" });
  }
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL,
        instructions,
        input: messages.map(({ role, content }) => ({ role, content })),
        max_output_tokens: 1600,
        store: false,
      }),
      signal: AbortSignal.timeout(35000),
    });
    if (!response.ok) {
      return res.status(response.status === 429 ? 429 : 502).json({ error: "Assistant unavailable" });
    }
    const data = await response.json();
    const reply = (data.output ?? [])
      .filter((item) => item.type === "message")
      .flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text")
      .map((item) => item.text)
      .join("\n")
      .trim();
    if (!reply || data.status !== "completed") {
      return res.status(502).json({ error: "No complete answer received" });
    }
    return res.status(200).json({ reply });
  } catch (error) {
    const timedOut = ["TimeoutError", "AbortError"].includes(error.name);
    return res.status(timedOut ? 504 : 502).json({ error: "Assistant unavailable" });
  }
}
