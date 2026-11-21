import * as chatService from "../services/chat.service.js";

/** POST /api/chat — validate the request, delegate to the chat service. */
export async function chat(req, res) {
  const { message, threadId } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Field 'message' (string) is required." });
  }
  if (!threadId || typeof threadId !== "string") {
    return res.status(400).json({ error: "Field 'threadId' (string) is required." });
  }

  try {
    const reply = await chatService.sendMessage(message, threadId);
    res.json({ reply });
  } catch (err) {
    console.error("Agent error:", err);
    res.status(500).json({ error: err.message ?? "Agent invocation failed." });
  }
}

/** GET /api/health — liveness check. */
export function health(_req, res) {
  res.json({ ok: true });
}
