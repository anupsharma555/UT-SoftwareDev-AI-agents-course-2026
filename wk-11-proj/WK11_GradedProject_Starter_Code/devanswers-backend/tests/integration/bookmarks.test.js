import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
// Import setup to initialize MongoDB
import "../setup.js";
import app from "../../src/app.js";
import Question from "../../src/models/Question.js";
import Answer from "../../src/models/Answer.js";
import Tag from "../../src/models/Tag.js";
import Bookmark from "../../src/models/Bookmark.js";
import dotenv from "dotenv";
dotenv.config();

let alice; // { user, token }
let bob;

async function createUserAndLogin(name) {
  const email = `${name}+${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`;
  const password = "password123";

  const userRes = await request(app)
    .post("/api/auth/register")
    .send({ name, email, password });
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  return { user: userRes.body.data, token: loginRes.body.data.token };
}

async function createQuestion(author, overrides = {}) {
  const tag = await Tag.create({ name: `tag-${Date.now()}-${Math.random()}` });
  return Question.create({
    title: "Bookmark Test Question",
    description: "Testing bookmarks",
    tags: [tag._id],
    author: author._id,
    ...overrides,
  });
}

const auth = (user) => ({ Authorization: `Bearer ${user.token}` });

beforeAll(async () => {
  alice = await createUserAndLogin("Alice");
  bob = await createUserAndLogin("Bob");
});

beforeEach(async () => {
  await Promise.all([
    Bookmark.deleteMany({}),
    Question.deleteMany({}),
    Answer.deleteMany({}),
  ]);
});

describe("Bookmarks API", () => {
  describe("authentication", () => {
    it("returns 401 on every route without a token", async () => {
      const id = new mongoose.Types.ObjectId().toString();

      const responses = await Promise.all([
        request(app).get("/api/bookmarks"),
        request(app).get("/api/bookmarks/ids"),
        request(app).post("/api/bookmarks").send({ questionId: id }),
        request(app).delete(`/api/bookmarks/${id}`),
      ]);

      responses.forEach((res) => {
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });

    it("returns 401 with an invalid token", async () => {
      const res = await request(app)
        .get("/api/bookmarks/ids")
        .set("Authorization", "Bearer not-a-real-token");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token is not valid.");
    });
  });

  describe("POST /api/bookmarks", () => {
    it("saves a question and returns 201", async () => {
      const question = await createQuestion(bob.user);

      const res = await request(app)
        .post("/api/bookmarks")
        .set(auth(alice))
        .send({ questionId: question._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        questionId: question._id.toString(),
        bookmarked: true,
      });
      expect(await Bookmark.countDocuments({})).toBe(1);
    });

    it("returns 200 and creates no duplicate when already saved", async () => {
      const question = await createQuestion(bob.user);
      const send = () =>
        request(app)
          .post("/api/bookmarks")
          .set(auth(alice))
          .send({ questionId: question._id.toString() });

      const first = await send();
      const second = await send();

      expect(first.status).toBe(201);
      expect(second.status).toBe(200);
      expect(await Bookmark.countDocuments({ user: alice.user._id })).toBe(1);
    });

    it("lets users bookmark their own questions", async () => {
      const question = await createQuestion(alice.user);

      const res = await request(app)
        .post("/api/bookmarks")
        .set(auth(alice))
        .send({ questionId: question._id.toString() });

      expect(res.status).toBe(201);
    });

    it("returns 404 for a question that does not exist", async () => {
      const res = await request(app)
        .post("/api/bookmarks")
        .set(auth(alice))
        .send({ questionId: new mongoose.Types.ObjectId().toString() });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Question not found");
    });

    it("returns 400 for a malformed questionId", async () => {
      const res = await request(app)
        .post("/api/bookmarks")
        .set(auth(alice))
        .send({ questionId: "not-an-id" });

      expect(res.status).toBe(400);
    });

    it("returns 400 (not 500) when questionId is a number", async () => {
      const res = await request(app)
        .post("/api/bookmarks")
        .set(auth(alice))
        .send({ questionId: 123 });

      expect(res.status).toBe(400);
    });

    it("returns 400 when questionId is missing", async () => {
      const res = await request(app)
        .post("/api/bookmarks")
        .set(auth(alice))
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/bookmarks/:questionId", () => {
    it("removes the bookmark and returns 200", async () => {
      const question = await createQuestion(bob.user);
      await Bookmark.create({ user: alice.user._id, question: question._id });

      const res = await request(app)
        .delete(`/api/bookmarks/${question._id}`)
        .set(auth(alice));

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        questionId: question._id.toString(),
        bookmarked: false,
      });
      expect(await Bookmark.countDocuments({})).toBe(0);
    });

    it("returns 200 when the question was not saved (idempotent)", async () => {
      const question = await createQuestion(bob.user);

      const res = await request(app)
        .delete(`/api/bookmarks/${question._id}`)
        .set(auth(alice));

      expect(res.status).toBe(200);
    });

    it("returns 400 for a malformed id", async () => {
      const res = await request(app)
        .delete("/api/bookmarks/nope")
        .set(auth(alice));

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/bookmarks/ids", () => {
    it("returns an empty array when nothing is saved", async () => {
      const res = await request(app).get("/api/bookmarks/ids").set(auth(alice));

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("returns saved ids, newest saved first", async () => {
      const q1 = await createQuestion(bob.user, { title: "First" });
      const q2 = await createQuestion(bob.user, { title: "Second" });
      await Bookmark.create({ user: alice.user._id, question: q1._id });
      await Bookmark.create({ user: alice.user._id, question: q2._id });

      const res = await request(app).get("/api/bookmarks/ids").set(auth(alice));

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([q2._id.toString(), q1._id.toString()]);
    });
  });

  describe("GET /api/bookmarks", () => {
    it("returns an empty array with 200 when nothing is saved", async () => {
      const res = await request(app).get("/api/bookmarks").set(auth(alice));

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("returns saved questions with author, tags and answerCount, newest saved first", async () => {
      const q1 = await createQuestion(bob.user, { title: "First" });
      const q2 = await createQuestion(bob.user, { title: "Second" });
      await Answer.create({
        questionId: q1._id,
        answerText: "An answer",
        author: alice.user._id,
      });
      await Bookmark.create({ user: alice.user._id, question: q1._id });
      await Bookmark.create({ user: alice.user._id, question: q2._id });

      const res = await request(app).get("/api/bookmarks").set(auth(alice));

      expect(res.status).toBe(200);
      expect(res.body.data.map((q) => q.title)).toEqual(["Second", "First"]);
      const first = res.body.data[1];
      expect(first.author.name).toBe("Bob");
      expect(first.author._id).toBeDefined();
      expect(first.tags[0].name).toBeDefined();
      expect(first.answerCount).toBe(1);
      expect(res.body.data[0].answerCount).toBe(0);
    });
  });

  describe("per-user isolation", () => {
    it("never mixes one user's saved questions with another's", async () => {
      const q1 = await createQuestion(alice.user, { title: "Alice saves this" });
      const q2 = await createQuestion(alice.user, { title: "Bob saves this" });
      await request(app).post("/api/bookmarks").set(auth(alice)).send({ questionId: q1._id.toString() });
      await request(app).post("/api/bookmarks").set(auth(bob)).send({ questionId: q2._id.toString() });

      const aliceIds = await request(app).get("/api/bookmarks/ids").set(auth(alice));
      const bobList = await request(app).get("/api/bookmarks").set(auth(bob));

      expect(aliceIds.body.data).toEqual([q1._id.toString()]);
      expect(bobList.body.data.map((q) => q.title)).toEqual(["Bob saves this"]);
    });

    it("does not let one user's unsave affect another user's bookmark", async () => {
      const question = await createQuestion(alice.user);
      await Bookmark.create({ user: alice.user._id, question: question._id });

      await request(app).delete(`/api/bookmarks/${question._id}`).set(auth(bob));

      expect(await Bookmark.countDocuments({ user: alice.user._id })).toBe(1);
    });
  });

  describe("deleting a question", () => {
    it("removes its bookmarks for every user", async () => {
      const question = await createQuestion(alice.user);
      await Bookmark.create({ user: alice.user._id, question: question._id });
      await Bookmark.create({ user: bob.user._id, question: question._id });

      const del = await request(app)
        .delete(`/api/questions/${question._id}`)
        .set(auth(alice));
      const bobIds = await request(app).get("/api/bookmarks/ids").set(auth(bob));

      expect(del.status).toBe(200);
      expect(bobIds.body.data).toEqual([]);
      expect(await Bookmark.countDocuments({})).toBe(0);
    });
  });
});
