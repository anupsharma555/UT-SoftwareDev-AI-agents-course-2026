import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import "../setup.js";
import app from "../../src/app.js";
import Question from "../../src/models/Question.js";
import Answer from "../../src/models/Answer.js";
import Tag from "../../src/models/Tag.js";
import dotenv from "dotenv";
dotenv.config();

let alice; // author of the posts under test: { user, token }
let bob; // another user
let admin; // an admin who is not the author

async function createUserAndLogin(name, isAdmin = false) {
  const email = `${name}+${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`;
  const password = "password123";

  const userRes = await request(app)
    .post("/api/auth/register")
    .send({ name, email, password, isAdmin });
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  return { user: userRes.body.data, token: loginRes.body.data.token };
}

const auth = (u) => ({ Authorization: `Bearer ${u.token}` });

async function createQuestion(overrides = {}) {
  // Reuse the tag so creating several questions in one test does not hit the unique name index.
  const tag = (await Tag.findOne({ name: "original" })) ?? (await Tag.create({ name: "original" }));
  return Question.create({
    title: "Original title",
    description: "Original description",
    tags: [tag._id],
    author: alice.user._id,
    ...overrides,
  });
}

async function createAnswer(question, overrides = {}) {
  return Answer.create({
    questionId: question._id,
    answerText: "Original answer",
    author: alice.user._id,
    ...overrides,
  });
}

const validQuestionEdit = {
  title: "Edited title",
  description: "Edited description",
  tags: "react, redux",
};

beforeAll(async () => {
  alice = await createUserAndLogin("Alice");
  bob = await createUserAndLogin("Bob");
  admin = await createUserAndLogin("Admin", true);
});

beforeEach(async () => {
  await Promise.all([Question.deleteMany({}), Answer.deleteMany({}), Tag.deleteMany({})]);
});

describe("Edit question: PUT /api/questions/:id", () => {
  it("lets the author edit, sets editedAt and returns the populated question", async () => {
    const question = await createQuestion();
    expect(question.editedAt).toBeNull();

    const res = await request(app)
      .put(`/api/questions/${question._id}`)
      .set(auth(alice))
      .send(validQuestionEdit);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Edited title");
    expect(res.body.data.description).toBe("Edited description");
    expect(res.body.data.editedAt).toBeTruthy();
    expect(res.body.data.author).toMatchObject({ _id: alice.user._id, name: "Alice" });
    expect(res.body.data.tags.map((t) => t.name).sort()).toEqual(["react", "redux"]);
  });

  it("stores the trimmed content", async () => {
    const question = await createQuestion();

    await request(app)
      .put(`/api/questions/${question._id}`)
      .set(auth(alice))
      .send({ title: "  Spaced  ", description: "  Body  ", tags: " a " });

    const saved = await Question.findById(question._id);
    expect(saved.title).toBe("Spaced");
    expect(saved.description).toBe("Body");
  });

  it("ignores empty tag segments and duplicates, and creates no blank tag", async () => {
    const question = await createQuestion();

    const res = await request(app)
      .put(`/api/questions/${question._id}`)
      .set(auth(alice))
      .send({ ...validQuestionEdit, tags: "a, ,b,, a" });

    expect(res.status).toBe(200);
    expect(res.body.data.tags.map((t) => t.name).sort()).toEqual(["a", "b"]);
    expect(await Tag.countDocuments({ name: "" })).toBe(0);
  });

  it("returns 403 for a user who is not the author and leaves the post unchanged", async () => {
    const question = await createQuestion();

    const res = await request(app)
      .put(`/api/questions/${question._id}`)
      .set(auth(bob))
      .send(validQuestionEdit);

    expect(res.status).toBe(403);
    const saved = await Question.findById(question._id);
    expect(saved.title).toBe("Original title");
    expect(saved.editedAt).toBeNull();
  });

  it("returns 403 for an admin who is not the author", async () => {
    const question = await createQuestion();

    const res = await request(app)
      .put(`/api/questions/${question._id}`)
      .set(auth(admin))
      .send(validQuestionEdit);

    expect(res.status).toBe(403);
    expect((await Question.findById(question._id)).title).toBe("Original title");
  });

  it("returns 401 without a token", async () => {
    const question = await createQuestion();

    const res = await request(app)
      .put(`/api/questions/${question._id}`)
      .send(validQuestionEdit);

    expect(res.status).toBe(401);
  });

  it("returns 404 for an unknown question", async () => {
    const res = await request(app)
      .put(`/api/questions/${new mongoose.Types.ObjectId()}`)
      .set(auth(alice))
      .send(validQuestionEdit);

    expect(res.status).toBe(404);
  });

  it("returns 400 for a malformed question id", async () => {
    const res = await request(app)
      .put("/api/questions/not-an-id")
      .set(auth(alice))
      .send(validQuestionEdit);

    expect(res.status).toBe(400);
  });

  it.each([
    ["a blank title", { title: "   " }, "Title is required"],
    ["a blank description", { description: "" }, "Description is required"],
    ["missing tags", { tags: undefined }, "At least one tag is required"],
    ["non-string tags", { tags: ["a", "b"] }, "At least one tag is required"],
    ["only empty tags", { tags: " , ,, " }, "At least one tag is required"],
  ])("returns 400 for %s and changes nothing", async (_name, patch, message) => {
    const question = await createQuestion();
    const tagCountBefore = await Tag.countDocuments({});

    const res = await request(app)
      .put(`/api/questions/${question._id}`)
      .set(auth(alice))
      .send({ ...validQuestionEdit, ...patch });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
    const saved = await Question.findById(question._id);
    expect(saved.title).toBe("Original title");
    expect(saved.editedAt).toBeNull();
    expect(await Tag.countDocuments({})).toBe(tagCountBefore);
  });

  it("does not create tags when the edit is rejected as unauthorized", async () => {
    const question = await createQuestion();
    const tagCountBefore = await Tag.countDocuments({});

    await request(app)
      .put(`/api/questions/${question._id}`)
      .set(auth(bob))
      .send({ ...validQuestionEdit, tags: "brand-new-tag" });

    expect(await Tag.countDocuments({})).toBe(tagCountBefore);
  });

  it("does not set editedAt when the content is unchanged", async () => {
    const question = await createQuestion();

    const res = await request(app)
      .put(`/api/questions/${question._id}`)
      .set(auth(alice))
      .send({ title: "Original title", description: "Original description", tags: "original" });

    expect(res.status).toBe(200);
    expect(res.body.data.editedAt).toBeNull();
    expect((await Question.findById(question._id)).editedAt).toBeNull();
  });

  it("does not mark an older, untrimmed question as edited when saved unchanged", async () => {
    const question = await createQuestion({
      title: "Original title ",
      description: "Original description\n",
    });

    const res = await request(app)
      .put(`/api/questions/${question._id}`)
      .set(auth(alice))
      .send({ title: "Original title", description: "Original description", tags: "original" });

    expect(res.status).toBe(200);
    expect(res.body.data.editedAt).toBeNull();
  });

  it("does not change editedAt when the question is voted on", async () => {
    const question = await createQuestion();
    const edit = await request(app)
      .put(`/api/questions/${question._id}`)
      .set(auth(alice))
      .send(validQuestionEdit);
    const editedAt = edit.body.data.editedAt;

    await request(app).post(`/api/questions/${question._id}/upvote`).set(auth(bob));

    const saved = await Question.findById(question._id);
    expect(saved.editedAt.toISOString()).toBe(editedAt);
  });

  it("never marks an unedited question as edited when it is voted on", async () => {
    const question = await createQuestion();

    await request(app).post(`/api/questions/${question._id}/upvote`).set(auth(bob));

    expect((await Question.findById(question._id)).editedAt).toBeNull();
  });
});

describe("Edit answer: PUT /api/answers/:answerId", () => {
  it("lets the author edit and sets editedAt", async () => {
    const question = await createQuestion();
    const answer = await createAnswer(question);

    const res = await request(app)
      .put(`/api/answers/${answer._id}`)
      .set(auth(alice))
      .send({ answerText: "Edited answer" });

    expect(res.status).toBe(200);
    expect(res.body.data.answerText).toBe("Edited answer");
    expect(res.body.data.editedAt).toBeTruthy();
    expect(res.body.data.author).toMatchObject({ name: "Alice" });
  });

  it("returns 403 for another user and for an admin who is not the author", async () => {
    const question = await createQuestion();
    const answer = await createAnswer(question);

    const asBob = await request(app)
      .put(`/api/answers/${answer._id}`)
      .set(auth(bob))
      .send({ answerText: "Hacked" });
    const asAdmin = await request(app)
      .put(`/api/answers/${answer._id}`)
      .set(auth(admin))
      .send({ answerText: "Hacked" });

    expect(asBob.status).toBe(403);
    expect(asAdmin.status).toBe(403);
    const saved = await Answer.findById(answer._id);
    expect(saved.answerText).toBe("Original answer");
    expect(saved.editedAt).toBeNull();
  });

  it("returns 401 without a token, 404 for an unknown answer and 400 for a malformed id", async () => {
    const question = await createQuestion();
    const answer = await createAnswer(question);

    const noToken = await request(app).put(`/api/answers/${answer._id}`).send({ answerText: "x" });
    const unknown = await request(app)
      .put(`/api/answers/${new mongoose.Types.ObjectId()}`)
      .set(auth(alice))
      .send({ answerText: "x" });
    const malformed = await request(app)
      .put("/api/answers/not-an-id")
      .set(auth(alice))
      .send({ answerText: "x" });

    expect(noToken.status).toBe(401);
    expect(unknown.status).toBe(404);
    expect(malformed.status).toBe(400);
  });

  it.each([
    ["blank text", "   "],
    ["empty text", ""],
    ["missing text", undefined],
  ])("returns 400 for %s and changes nothing", async (_name, answerText) => {
    const question = await createQuestion();
    const answer = await createAnswer(question);

    const res = await request(app)
      .put(`/api/answers/${answer._id}`)
      .set(auth(alice))
      .send({ answerText });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Answer text is required");
    const saved = await Answer.findById(answer._id);
    expect(saved.answerText).toBe("Original answer");
    expect(saved.editedAt).toBeNull();
  });

  it("does not set editedAt when the text is unchanged", async () => {
    const question = await createQuestion();
    const answer = await createAnswer(question);

    const res = await request(app)
      .put(`/api/answers/${answer._id}`)
      .set(auth(alice))
      .send({ answerText: "Original answer" });

    expect(res.status).toBe(200);
    expect(res.body.data.editedAt).toBeNull();
  });

  it("does not mark an older, untrimmed answer as edited when saved unchanged", async () => {
    const question = await createQuestion();
    const answer = await createAnswer(question, { answerText: "Original answer\n" });

    const res = await request(app)
      .put(`/api/answers/${answer._id}`)
      .set(auth(alice))
      .send({ answerText: "Original answer" });

    expect(res.body.data.editedAt).toBeNull();
  });

  it("does not change editedAt when the answer is voted on", async () => {
    const question = await createQuestion();
    const answer = await createAnswer(question);
    await request(app).post(`/api/answers/${answer._id}/upvote`).set(auth(bob));

    expect((await Answer.findById(answer._id)).editedAt).toBeNull();
  });
});

describe("Reading edited posts", () => {
  it("GET /api/questions/:id returns editedAt for the question and its answers", async () => {
    const question = await createQuestion();
    const answer = await createAnswer(question);
    await request(app)
      .put(`/api/questions/${question._id}`)
      .set(auth(alice))
      .send(validQuestionEdit);
    await request(app)
      .put(`/api/answers/${answer._id}`)
      .set(auth(alice))
      .send({ answerText: "Edited answer" });
    const plainQuestion = await createQuestion({ title: "Never edited" });

    const edited = await request(app).get(`/api/questions/${question._id}`);
    const untouched = await request(app).get(`/api/questions/${plainQuestion._id}`);

    expect(edited.body.data.editedAt).toBeTruthy();
    expect(edited.body.data.answers[0].editedAt).toBeTruthy();
    expect(untouched.body.data.editedAt).toBeNull();
  });
});
