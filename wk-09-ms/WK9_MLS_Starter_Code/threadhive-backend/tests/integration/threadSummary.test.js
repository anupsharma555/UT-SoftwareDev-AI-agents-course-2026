import { beforeAll, beforeEach, describe, it, expect, vi } from "vitest";
import request from "supertest";
import "../setup.js";

vi.mock("../../src/utils/aiProvider.js", () => ({ generateText: vi.fn() }));

import app from "../../src/app.js";
import { generateText } from "../../src/utils/aiProvider.js";
import Thread from "../../src/models/Thread.js";
import Comment from "../../src/models/Comment.js";
import Subreddit from "../../src/models/Subreddit.js";
import { createAppError } from "../../src/utils/createAppError.js";

let jwtToken;
let mockUser;

beforeAll(async () => {
  const email = `summaryuser+${Date.now()}@example.com`;
  const password = "password123";
  const reg = await request(app)
    .post("/api/auth/register")
    .send({ name: "Summary User", email, password, isAdmin: false });
  const login = await request(app).post("/api/auth/login").send({ email, password });
  mockUser = reg.body.data;
  jwtToken = login.body.data.token;
});

describe("GET /api/threads/:id/summary", () => {
  let thread;

  beforeEach(async () => {
    vi.clearAllMocks();
    await Thread.deleteMany({});
    await Comment.deleteMany({});
    await Subreddit.deleteMany({});
    const subreddit = await Subreddit.create({
      name: "summary-sub",
      description: "d",
      author: mockUser._id,
    });
    thread = await Thread.create({
      title: "Best pizza?",
      content: "Where do you get pizza?",
      author: mockUser._id,
      subreddit: subreddit._id,
    });
    await Comment.create({ thread: thread._id, user: mockUser._id, content: "Joe's is great" });
  });

  const get = (id) =>
    request(app).get(`/api/threads/${id}/summary`).set("Authorization", `Bearer ${jwtToken}`);

  it("returns the summary and sends thread + comments to the AI", async () => {
    generateText.mockResolvedValue("A summary.");
    const res = await get(thread._id);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ summary: "A summary." });
    const { prompt } = generateText.mock.calls[0][0];
    expect(prompt).toContain("Best pizza?");
    expect(prompt).toContain("Joe's is great");
    expect(prompt).toContain("Summary User");
  });

  it("requires authentication", async () => {
    const res = await request(app).get(`/api/threads/${thread._id}/summary`);
    expect(res.status).toBe(401);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown thread without calling the AI", async () => {
    const res = await get("507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("propagates AI failures as an error response", async () => {
    generateText.mockRejectedValue(createAppError("Failed to generate response. Please try again.", 502));
    const res = await get(thread._id);
    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
  });
});
