import { agent } from "../agent.js";

/**
 * Send a user message to the travel agent within the given conversation thread.
 * The agent's MemorySaver checkpointer persists history per threadId, so user
 * preferences from earlier turns are applied automatically.
 *
 * @param {string} message  The user's message.
 * @param {string} threadId Stable identifier for the conversation thread.
 * @returns {Promise<string>} The agent's reply text.
 */
export async function sendMessage(message, threadId) {
  const result = await agent.invoke(
    { messages: [{ role: "user", content: message }] },
    { configurable: { thread_id: threadId } }
  );

  const last = result.messages[result.messages.length - 1];
  return typeof last.content === "string"
    ? last.content
    : last.content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
}
