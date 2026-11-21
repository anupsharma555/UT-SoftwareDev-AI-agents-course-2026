import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addBookmarkService,
  removeBookmarkService,
  getBookmarkedIdsService,
  getBookmarkedQuestionsService,
} from "../../../src/services/bookmarkService.js";
import Bookmark from "../../../src/models/Bookmark.js";
import Question from "../../../src/models/Question.js";
import Answer from "../../../src/models/Answer.js";

vi.mock("../../../src/models/Bookmark.js");
vi.mock("../../../src/models/Question.js");
vi.mock("../../../src/models/Answer.js");

const USER_ID = "507f1f77bcf86cd799439011";
const QUESTION_ID = "507f1f77bcf86cd799439012";

describe("bookmarkService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addBookmarkService", () => {
    it("creates a bookmark and reports created: true", async () => {
      Question.exists.mockResolvedValue({ _id: QUESTION_ID });
      Bookmark.create.mockResolvedValue({});

      const result = await addBookmarkService(USER_ID, QUESTION_ID);

      expect(Bookmark.create).toHaveBeenCalledWith({ user: USER_ID, question: QUESTION_ID });
      expect(result).toEqual({ created: true });
    });

    it("reports created: false when the question is already saved (duplicate key)", async () => {
      Question.exists.mockResolvedValue({ _id: QUESTION_ID });
      Bookmark.create.mockRejectedValue(Object.assign(new Error("dup"), { code: 11000 }));

      const result = await addBookmarkService(USER_ID, QUESTION_ID);

      expect(result).toEqual({ created: false });
    });

    it("rethrows unexpected database errors", async () => {
      Question.exists.mockResolvedValue({ _id: QUESTION_ID });
      Bookmark.create.mockRejectedValue(new Error("db down"));

      await expect(addBookmarkService(USER_ID, QUESTION_ID)).rejects.toThrow("db down");
    });

    it("throws 404 when the question does not exist", async () => {
      Question.exists.mockResolvedValue(null);

      await expect(addBookmarkService(USER_ID, QUESTION_ID)).rejects.toMatchObject({
        message: "Question not found",
        statusCode: 404,
      });
      expect(Bookmark.create).not.toHaveBeenCalled();
    });

    it("throws 400 when questionId is missing", async () => {
      await expect(addBookmarkService(USER_ID, undefined)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("throws 400 when questionId is malformed", async () => {
      await expect(addBookmarkService(USER_ID, "not-an-id")).rejects.toMatchObject({
        message: "Invalid question id",
        statusCode: 400,
      });
    });
  });

  describe("removeBookmarkService", () => {
    it("deletes the user's bookmark", async () => {
      Bookmark.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await removeBookmarkService(USER_ID, QUESTION_ID);

      expect(Bookmark.deleteOne).toHaveBeenCalledWith({ user: USER_ID, question: QUESTION_ID });
    });

    it("succeeds even when nothing was deleted (idempotent)", async () => {
      Bookmark.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(removeBookmarkService(USER_ID, QUESTION_ID)).resolves.toBeUndefined();
    });

    it("throws 400 for a malformed questionId", async () => {
      await expect(removeBookmarkService(USER_ID, "nope")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(Bookmark.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe("getBookmarkedIdsService", () => {
    it("returns question ids as strings, newest first", async () => {
      const select = vi.fn().mockResolvedValue([
        { question: { toString: () => "q2" } },
        { question: { toString: () => "q1" } },
      ]);
      const sort = vi.fn().mockReturnValue({ select });
      Bookmark.find.mockReturnValue({ sort });

      const ids = await getBookmarkedIdsService(USER_ID);

      expect(Bookmark.find).toHaveBeenCalledWith({ user: USER_ID });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
      expect(ids).toEqual(["q2", "q1"]);
    });

    it("returns an empty array when nothing is saved", async () => {
      const select = vi.fn().mockResolvedValue([]);
      Bookmark.find.mockReturnValue({ sort: vi.fn().mockReturnValue({ select }) });

      expect(await getBookmarkedIdsService(USER_ID)).toEqual([]);
    });
  });

  describe("getBookmarkedQuestionsService", () => {
    const mockFindChain = (bookmarks) => {
      const populate = vi.fn().mockResolvedValue(bookmarks);
      Bookmark.find.mockReturnValue({ sort: vi.fn().mockReturnValue({ populate }) });
    };

    it("returns saved questions with answerCount, skipping orphans", async () => {
      const q1 = { _id: "q1", title: "One", toObject: () => ({ _id: "q1", title: "One" }) };
      mockFindChain([{ question: q1 }, { question: null }]);
      Answer.countDocuments.mockResolvedValue(3);

      const result = await getBookmarkedQuestionsService(USER_ID);

      expect(Answer.countDocuments).toHaveBeenCalledWith({ questionId: "q1" });
      expect(result).toEqual([{ _id: "q1", title: "One", answerCount: 3 }]);
    });

    it("returns an empty array (not an error) when nothing is saved", async () => {
      mockFindChain([]);

      expect(await getBookmarkedQuestionsService(USER_ID)).toEqual([]);
    });
  });
});
