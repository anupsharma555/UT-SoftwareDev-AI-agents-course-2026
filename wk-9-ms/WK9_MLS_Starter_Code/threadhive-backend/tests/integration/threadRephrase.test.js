import { beforeAll, beforeEach, describe, it, expect, vi } from "vitest";
import request from "supertest";
import "../setup.js";

vi.mock("../../src/utils/aiProvider.js", () => ({ generateText: vi.fn() }));

import app from "../../src/app.js";
import { generateText } from "../../src/utils/aiProvider.js";
import { createAppError } from "../../src/utils/createAppError.js";

let jwtToken;

beforeAll(async () => {
  const email = `rephraseuser+${Date.now()}@example.com`;
  const password = "password123";
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Rephrase User", email, password, isAdmin: false });
  const login = await request(app).post("/api/auth/login").send({ email, password });
  jwtToken = login.body.data.token;
});

describe("POST /api/threads/rephrase", () => {
  beforeEach(() => vi.clearAllMocks());

  const post = (body) =>
    request(app)
      .post("/api/threads/rephrase")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(body);

  it("returns the rephrased text and sends the original to the AI", async () => {
    generateText.mockResolvedValue("A clearer sentence.");
    const res = await post({ text: "me no good write" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ rephrased: "A clearer sentence." });
    expect(generateText.mock.calls[0][0].prompt).toBe("me no good write");
  });

  it("requires authentication", async () => {
    const res = await request(app).post("/api/threads/rephrase").send({ text: "hi" });
    expect(res.status).toBe(401);
    expect(generateText).not.toHaveBeenCalled();
  });

  it.each([[{}], [{ text: "   " }], [{ text: 42 }]])(
    "returns 400 for invalid body %j without calling the AI",
    async (body) => {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(generateText).not.toHaveBeenCalled();
    },
  );

  it("returns 400 for overly long text", async () => {
    const res = await post({ text: "a".repeat(5001) });
    expect(res.status).toBe(400);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("propagates AI failures as an error response", async () => {
    generateText.mockRejectedValue(createAppError("Failed to generate response. Please try again.", 502));
    const res = await post({ text: "hello" });
    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
  });
});
