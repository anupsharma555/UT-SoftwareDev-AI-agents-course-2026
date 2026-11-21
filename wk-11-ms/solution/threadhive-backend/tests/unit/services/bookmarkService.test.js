import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createBookmark,
  removeBookmark,
  getBookmarksByUser,
} from "../../../src/services/bookmarkService.js";
import Bookmark from "../../../src/models/Bookmark.js";
import Thread from "../../../src/models/Thread.js";

// Mock the models
vi.mock("../../../src/models/Bookmark.js");
vi.mock("../../../src/models/Thread.js");

const VALID_ID = "507f1f77bcf86cd799439011";
const USER_ID = "507f191e810c19729de860ea";

describe("bookmarkService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBookmark", () => {
    it("creates a bookmark and returns created: true", async () => {
      const mockBookmark = { _id: "bm1", user: USER_ID, thread: VALID_ID };
      Thread.findById = vi.fn().mockResolvedValue({ _id: VALID_ID });
      Bookmark.create = vi.fn().mockResolvedValue(mockBookmark);

      const result = await createBookmark(USER_ID, VALID_ID);

      expect(Thread.findById).toHaveBeenCalledWith(VALID_ID);
      expect(Bookmark.create).toHaveBeenCalledWith({
        user: USER_ID,
        thread: VALID_ID,
      });
      expect(result).toEqual({ bookmark: mockBookmark, created: true });
    });

    it("is idempotent on E11000 (returns existing, created: false)", async () => {
      const existing = { _id: "bm1", user: USER_ID, thread: VALID_ID };
      Thread.findById = vi.fn().mockResolvedValue({ _id: VALID_ID });
      const dupErr = new Error("E11000 duplicate key");
      dupErr.code = 11000;
      Bookmark.create = vi.fn().mockRejectedValue(dupErr);
      Bookmark.findOne = vi.fn().mockResolvedValue(existing);

      const result = await createBookmark(USER_ID, VALID_ID);

      expect(Bookmark.findOne).toHaveBeenCalledWith({
        user: USER_ID,
        thread: VALID_ID,
      });
      expect(result).toEqual({ bookmark: existing, created: false });
    });

    it("rethrows non-duplicate errors", async () => {
      Thread.findById = vi.fn().mockResolvedValue({ _id: VALID_ID });
      Bookmark.create = vi.fn().mockRejectedValue(new Error("DB down"));

      await expect(createBookmark(USER_ID, VALID_ID)).rejects.toThrow(
        "DB down",
      );
    });

    it("throws 404 when thread is missing", async () => {
      Thread.findById = vi.fn().mockResolvedValue(null);

      await expect(createBookmark(USER_ID, VALID_ID)).rejects.toMatchObject({
        message: "Thread not found",
        statusCode: 404,
      });
    });

    it("throws 400 on invalid thread id", async () => {
      await expect(createBookmark(USER_ID, "not-an-id")).rejects.toMatchObject({
        message: "Invalid thread id",
        statusCode: 400,
      });
    });
  });

  describe("removeBookmark", () => {
    it("deletes by user + thread", async () => {
      Bookmark.findOneAndDelete = vi.fn().mockResolvedValue({ _id: "bm1" });

      await removeBookmark(USER_ID, VALID_ID);

      expect(Bookmark.findOneAndDelete).toHaveBeenCalledWith({
        user: USER_ID,
        thread: VALID_ID,
      });
    });

    it("is idempotent when nothing matched (no throw)", async () => {
      Bookmark.findOneAndDelete = vi.fn().mockResolvedValue(null);

      await expect(removeBookmark(USER_ID, VALID_ID)).resolves.toBeUndefined();
    });

    it("throws 400 on invalid thread id", async () => {
      await expect(removeBookmark(USER_ID, "not-an-id")).rejects.toMatchObject({
        message: "Invalid thread id",
        statusCode: 400,
      });
    });
  });

  describe("getBookmarksByUser", () => {
    it("sorts by createdAt desc and returns the threads", async () => {
      const threads = [
        { _id: "t2", title: "Second" },
        { _id: "t1", title: "First" },
      ];
      const sortSpy = vi.fn().mockReturnThis();
      const populateSpy = vi
        .fn()
        .mockResolvedValue(threads.map((thread) => ({ thread })));

      Bookmark.find = vi.fn().mockReturnValue({
        sort: sortSpy,
        populate: populateSpy,
      });

      const result = await getBookmarksByUser(USER_ID);

      expect(Bookmark.find).toHaveBeenCalledWith({ user: USER_ID });
      expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(threads);
    });

    it("filters out bookmarks whose thread populated to null", async () => {
      const populateSpy = vi.fn().mockResolvedValue([
        { thread: { _id: "t1", title: "Alive" } },
        { thread: null },
      ]);

      Bookmark.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        populate: populateSpy,
      });

      const result = await getBookmarksByUser(USER_ID);

      expect(result).toEqual([{ _id: "t1", title: "Alive" }]);
    });
  });
});
