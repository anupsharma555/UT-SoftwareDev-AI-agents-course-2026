import { describe, it, expect } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import app from "../src/app.js";

// NOTE: These are live integration tests — they hit the real Gemini, Tavily,
// and wttr.in APIs (no mocks). They require GOOGLE_API_KEY and TAVILY_API_KEY
// in server/.env, consume API quota, and take ~1-2 minutes in total.
// LLM output varies between runs, so assertions are intentionally loose
// (status codes, non-empty replies, keyword heuristics).

const postChat = (message, threadId) =>
  request(app).post("/api/chat").send({ message, threadId });

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe("POST /api/chat — validation", () => {
  it("rejects a missing message with 400", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ threadId: randomUUID() });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/'message'/);
  });

  it("rejects a missing threadId with 400", async () => {
    const res = await request(app).post("/api/chat").send({ message: "hi" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/'threadId'/);
  });

  it("rejects a non-string message with 400", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: 42, threadId: randomUUID() });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/'message'/);
  });
});

describe("POST /api/chat — agent tool paths (live APIs)", () => {
  it("answers a weather query using the wttr.in tool", async () => {
    const res = await postChat(
      "What is the current weather in Paris? Include the temperature in Celsius.",
      randomUUID()
    );
    expect(res.status).toBe(200);
    expect(res.body.reply).toBeTruthy();
    expect(res.body.reply).toMatch(/°C|celsius|temperature|weather/i);
  });

  it("answers a travel query using Tavily web search", async () => {
    const res = await postChat(
      "Search the web: what are the top 3 tourist attractions in Rome?",
      randomUUID()
    );
    expect(res.status).toBe(200);
    expect(res.body.reply).toBeTruthy();
    expect(res.body.reply).toMatch(/rome|colosseum|vatican|trevi|pantheon/i);
  });
});

describe("POST /api/chat — checkpointer memory", () => {
  const memoryThread = randomUUID();

  it("stores a user preference in the conversation thread", async () => {
    const res = await postChat(
      "Remember this: I am strictly vegetarian.",
      memoryThread
    );
    expect(res.status).toBe(200);
    expect(res.body.reply).toBeTruthy();
  });

  it("recalls the preference in a later turn on the same thread", async () => {
    const res = await postChat(
      "What dietary preference did I tell you?",
      memoryThread
    );
    expect(res.status).toBe(200);
    expect(res.body.reply).toMatch(/vegetarian/i);
  });

  it("does not leak the preference into a different thread", async () => {
    const res = await postChat(
      "What dietary preference did I tell you earlier?",
      randomUUID()
    );
    expect(res.status).toBe(200);
    expect(res.body.reply).not.toMatch(/vegetarian/i);
  });
});
