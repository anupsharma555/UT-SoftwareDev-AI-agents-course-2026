import { beforeEach, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
// Import setup to initialize MongoDB
import "../setup.js";
import app from "../../src/app.js";
import Question from "../../src/models/Question.js";
import Answer from "../../src/models/Answer.js";
import Tag from "../../src/models/Tag.js";
import Bookmark from "../../src/models/Bookmark.js";
import dotenv from "dotenv";
dotenv.config();

let userA;
let tokenA;
let userB;
let tokenB;

async function createUserAndLogin(overrides = {}) {
  const email = overrides.email || `bmuser+${Date.now()}-${Math.random()}@example.com`;
  const password = "password123";

  const userRes = await request(app)
    .post("/api/auth/register")
    .send({
      name: overrides.name || "Bookmark User",
      email,
      password,
      isAdmin: overrides.isAdmin || false,
    });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  return {
    mockUser: userRes.body.data,
    jwtToken: loginRes.body.data.token,
  };
}

async function createQuestion(authorId, overrides = {}) {
  const tag = await Tag.create({ name: `tag-${Date.now()}-${Math.random()}` });

  const question = new Question({
    title: overrides.title || "Bookmark Test Question",
    description: overrides.description || "Testing bookmarks",
    tags: [tag._id],
    author: authorId,
    ...overrides,
  });
  await question.save();
  return question;
}

describe("Bookmarks API", () => {
  beforeAll(async () => {
    ({ mockUser: userA, jwtToken: tokenA } = await createUserAndLogin({
      name: "User A",
    }));
    ({ mockUser: userB, jwtToken: tokenB } = await createUserAndLogin({
      name: "User B",
    }));
  });

  beforeEach(async () => {
    await Promise.all([
      Bookmark.deleteMany({}),
      Question.deleteMany({}),
      Answer.deleteMany({}),
      Tag.deleteMany({}),
    ]);
  });

  // -------------------
  // AUTH
  // -------------------
  describe("authentication", () => {
    it("returns 401 for GET /api/bookmarks without a token", async () => {
      const res = await request(app).get("/api/bookmarks");
      expect(res.status).toBe(401);
    });

    it("returns 401 for GET /api/bookmarks/ids without a token", async () => {
      const res = await request(app).get("/api/bookmarks/ids");
      expect(res.status).toBe(401);
    });

    it("returns 401 for POST /api/bookmarks without a token", async () => {
      const question = await createQuestion(userA._id);
      const res = await request(app)
        .post("/api/bookmarks")
        .send({ questionId: question._id });
      expect(res.status).toBe(401);
    });

    it("returns 401 for DELETE /api/bookmarks/:questionId without a token", async () => {
      const question = await createQuestion(userA._id);
      const res = await request(app).delete(`/api/bookmarks/${question._id}`);
      expect(res.status).toBe(401);
    });
  });

  // -------------------
  // SAVE
  // -------------------
  describe("POST /api/bookmarks", () => {
    it("saves a question -> 201, re-saving -> 200 with exactly one bookmark", async () => {
      const question = await createQuestion(userA._id);

      const first = await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ questionId: question._id });

      expect(first.status).toBe(201);
      expect(first.body.success).toBe(true);
      expect(first.body.message).toBe("Question saved");
      expect(first.body.data.question).toBe(question._id.toString());

      const second = await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ questionId: question._id });

      expect(second.status).toBe(200);
      expect(second.body.message).toBe("Question already saved");

      expect(await Bookmark.countDocuments({})).toBe(1);
    });

    it("returns 404 for a non-existent question", async () => {
      const res = await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ questionId: "507f1f77bcf86cd799439011" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Question not found");
    });

    it("returns 400 for a malformed questionId", async () => {
      const res = await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ questionId: "not-valid" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for a missing questionId", async () => {
      const res = await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // -------------------
  // LIST
  // -------------------
  describe("GET /api/bookmarks", () => {
    it("returns saved questions newest-first with populated author/tags/answerCount", async () => {
      const older = await createQuestion(userA._id, { title: "Older" });
      const newer = await createQuestion(userA._id, { title: "Newer" });

      await Answer.create({
        questionId: older._id,
        answerText: "an answer",
        author: userA._id,
      });

      await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ questionId: older._id });
      await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ questionId: newer._id });

      const res = await request(app)
        .get("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe("Newer");
      expect(res.body.data[1].title).toBe("Older");
      expect(res.body.data[1].author.name).toBe("User A");
      expect(res.body.data[1].tags[0].name).toBeTruthy();
      expect(res.body.data[1].answerCount).toBe(1);
      expect(res.body.data[0].answerCount).toBe(0);
    });

    it("returns 200 with an empty array when nothing is saved", async () => {
      const res = await request(app)
        .get("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("does not expose User A's bookmarks to User B", async () => {
      const question = await createQuestion(userA._id);
      await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ questionId: question._id });

      const res = await request(app)
        .get("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  // -------------------
  // IDS
  // -------------------
  describe("GET /api/bookmarks/ids", () => {
    it("returns the array of saved question id strings", async () => {
      const q1 = await createQuestion(userA._id);
      const q2 = await createQuestion(userA._id);

      await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ questionId: q1._id });
      await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ questionId: q2._id });

      const res = await request(app)
        .get("/api/bookmarks/ids")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data).toContain(q1._id.toString());
      expect(res.body.data).toContain(q2._id.toString());
    });
  });

  // -------------------
  // UNSAVE
  // -------------------
  describe("DELETE /api/bookmarks/:questionId", () => {
    it("unsaves -> 200, repeat -> 200 (idempotent), and is gone from the list", async () => {
      const question = await createQuestion(userA._id);
      await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ questionId: question._id });

      const first = await request(app)
        .delete(`/api/bookmarks/${question._id}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(first.status).toBe(200);
      expect(first.body.message).toBe("Question unsaved");

      // Idempotent — deleting again still succeeds.
      const second = await request(app)
        .delete(`/api/bookmarks/${question._id}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(second.status).toBe(200);

      const list = await request(app)
        .get("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`);
      expect(list.body.data).toEqual([]);
    });
  });

  // -------------------
  // CASCADE ON QUESTION DELETE
  // -------------------
  describe("cascade on question deletion", () => {
    it("removes bookmarks when the question is deleted", async () => {
      const question = await createQuestion(userA._id);

      await request(app)
        .post("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ questionId: question._id });

      // Author deletes the question.
      const del = await request(app)
        .delete(`/api/questions/${question._id}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(del.status).toBe(200);

      const list = await request(app)
        .get("/api/bookmarks")
        .set("Authorization", `Bearer ${tokenA}`);
      expect(list.status).toBe(200);
      expect(list.body.data).toEqual([]);
      expect(await Bookmark.countDocuments({})).toBe(0);
    });
  });
});
