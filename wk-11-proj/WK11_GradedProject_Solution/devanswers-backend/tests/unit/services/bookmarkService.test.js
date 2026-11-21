import { describe, it, expect, beforeEach } from "vitest";
// Import setup to initialize the in-memory MongoDB (populate/sort/index behaviour
// is exercised against a real DB, unlike the mocked service tests).
import "../../setup.js";
import {
  saveBookmarkService,
  unsaveBookmarkService,
  getSavedQuestionsService,
  getSavedQuestionIdsService,
} from "../../../src/services/bookmarkService.js";
import Bookmark from "../../../src/models/Bookmark.js";
import Question from "../../../src/models/Question.js";
import Answer from "../../../src/models/Answer.js";
import Tag from "../../../src/models/Tag.js";
import User from "../../../src/models/User.js";

let user;
let otherUser;

async function createUser(overrides = {}) {
  return User.create({
    name: overrides.name || "Bookmark User",
    email: overrides.email || `bm-${Date.now()}-${Math.random()}@example.com`,
    password: "password123",
    ...overrides,
  });
}

async function createQuestion(author, overrides = {}) {
  const tag = await Tag.create({ name: `tag-${Date.now()}-${Math.random()}` });
  return Question.create({
    title: overrides.title || "Saved Question",
    description: overrides.description || "Question body",
    tags: [tag._id],
    author: author._id,
    ...overrides,
  });
}

describe("bookmarkService", () => {
  beforeEach(async () => {
    await Promise.all([
      Bookmark.deleteMany({}),
      Question.deleteMany({}),
      Answer.deleteMany({}),
      Tag.deleteMany({}),
      User.deleteMany({}),
    ]);

    user = await createUser({ name: "Primary" });
    otherUser = await createUser({ name: "Other" });
  });

  describe("saveBookmarkService", () => {
    it("creates a bookmark and returns it with created: true", async () => {
      const question = await createQuestion(user);

      const { bookmark, created } = await saveBookmarkService(
        user._id,
        question._id,
      );

      expect(created).toBe(true);
      expect(bookmark.user.toString()).toBe(user._id.toString());
      expect(bookmark.question.toString()).toBe(question._id.toString());
      expect(await Bookmark.countDocuments({})).toBe(1);
    });

    it("returns the existing bookmark without creating a duplicate (created: false)", async () => {
      const question = await createQuestion(user);

      const first = await saveBookmarkService(user._id, question._id);
      const second = await saveBookmarkService(user._id, question._id);

      expect(first.created).toBe(true);
      expect(second.created).toBe(false);
      expect(second.bookmark._id.toString()).toBe(first.bookmark._id.toString());
      expect(await Bookmark.countDocuments({})).toBe(1);
    });

    it("throws 404 when the question does not exist", async () => {
      const missingId = "507f1f77bcf86cd799439011";

      await expect(
        saveBookmarkService(user._id, missingId),
      ).rejects.toThrow("Question not found");
      await expect(
        saveBookmarkService(user._id, missingId),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("throws 400 for a malformed questionId", async () => {
      await expect(
        saveBookmarkService(user._id, "not-an-object-id"),
      ).rejects.toThrow("A valid questionId is required");
      await expect(
        saveBookmarkService(user._id, "not-an-object-id"),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("allows a user to bookmark their own question", async () => {
      const question = await createQuestion(user);

      const { created } = await saveBookmarkService(user._id, question._id);

      expect(created).toBe(true);
    });
  });

  describe("unsaveBookmarkService", () => {
    it("removes the bookmark and is a no-op when called again", async () => {
      const question = await createQuestion(user);
      await saveBookmarkService(user._id, question._id);

      const result = await unsaveBookmarkService(user._id, question._id);
      expect(result).toEqual({ questionId: question._id });
      expect(await Bookmark.countDocuments({})).toBe(0);

      // Unsaving again does not throw.
      await expect(
        unsaveBookmarkService(user._id, question._id),
      ).resolves.toEqual({ questionId: question._id });
    });

    it("throws 400 for a malformed questionId", async () => {
      await expect(
        unsaveBookmarkService(user._id, "bad-id"),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("getSavedQuestionsService", () => {
    it("returns the user's bookmarks newest-first with author, tags and answerCount", async () => {
      const older = await createQuestion(user, { title: "Older" });
      const newer = await createQuestion(user, { title: "Newer" });

      // Save older first so newer has a later createdAt.
      await saveBookmarkService(user._id, older._id);
      await saveBookmarkService(user._id, newer._id);

      // Two answers on the older question.
      await Answer.create({
        questionId: older._id,
        answerText: "a1",
        author: user._id,
      });
      await Answer.create({
        questionId: older._id,
        answerText: "a2",
        author: user._id,
      });

      const result = await getSavedQuestionsService(user._id);

      expect(result).toHaveLength(2);
      // Newest saved first.
      expect(result[0].title).toBe("Newer");
      expect(result[1].title).toBe("Older");
      // Populated author (name only) and tags.
      expect(result[1].author.name).toBe("Primary");
      expect(result[1].author.email).toBeUndefined();
      expect(result[1].tags[0].name).toBeTruthy();
      // answerCount attached.
      expect(result[1].answerCount).toBe(2);
      expect(result[0].answerCount).toBe(0);
      // savedAt mirrors the bookmark createdAt.
      expect(result[0].savedAt).toBeInstanceOf(Date);
    });

    it("excludes other users' bookmarks", async () => {
      const mine = await createQuestion(user, { title: "Mine" });
      const theirs = await createQuestion(otherUser, { title: "Theirs" });

      await saveBookmarkService(user._id, mine._id);
      await saveBookmarkService(otherUser._id, theirs._id);

      const result = await getSavedQuestionsService(user._id);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Mine");
    });

    it("returns an empty array when the user has saved nothing", async () => {
      const result = await getSavedQuestionsService(user._id);
      expect(result).toEqual([]);
    });

    it("omits bookmarks whose question was deleted", async () => {
      const question = await createQuestion(user);
      await saveBookmarkService(user._id, question._id);

      // Delete the question directly, leaving a dangling bookmark.
      await Question.findByIdAndDelete(question._id);

      const result = await getSavedQuestionsService(user._id);
      expect(result).toEqual([]);
    });
  });

  describe("getSavedQuestionIdsService", () => {
    it("returns the saved question id strings for the user only", async () => {
      const q1 = await createQuestion(user, { title: "Q1" });
      const q2 = await createQuestion(user, { title: "Q2" });
      const theirs = await createQuestion(otherUser, { title: "Theirs" });

      await saveBookmarkService(user._id, q1._id);
      await saveBookmarkService(user._id, q2._id);
      await saveBookmarkService(otherUser._id, theirs._id);

      const ids = await getSavedQuestionIdsService(user._id);

      expect(ids).toHaveLength(2);
      expect(ids.every((id) => typeof id === "string")).toBe(true);
      expect(ids).toContain(q1._id.toString());
      expect(ids).toContain(q2._id.toString());
      expect(ids).not.toContain(theirs._id.toString());
    });

    it("returns an empty array when none are saved", async () => {
      const ids = await getSavedQuestionIdsService(user._id);
      expect(ids).toEqual([]);
    });
  });
});
