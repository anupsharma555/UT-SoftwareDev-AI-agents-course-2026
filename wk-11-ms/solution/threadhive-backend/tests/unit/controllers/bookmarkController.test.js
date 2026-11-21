import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addBookmark,
  deleteBookmark,
  getBookmarks,
} from "../../../src/controllers/bookmarkController.js";
import * as bookmarkService from "../../../src/services/bookmarkService.js";

// Mock the bookmark service
vi.mock("../../../src/services/bookmarkService.js");

describe("bookmarkController", () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      params: {},
      user: { userId: "user123" },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("addBookmark", () => {
    it("returns 201 when a new bookmark is created", async () => {
      req.params.id = "thread123";
      const bookmark = { _id: "bm1", user: "user123", thread: "thread123" };
      bookmarkService.createBookmark = vi
        .fn()
        .mockResolvedValue({ bookmark, created: true });

      await addBookmark(req, res);

      expect(bookmarkService.createBookmark).toHaveBeenCalledWith(
        "user123",
        "thread123",
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Thread bookmarked successfully",
        data: bookmark,
      });
    });

    it("returns 200 when the thread was already bookmarked", async () => {
      req.params.id = "thread123";
      const bookmark = { _id: "bm1", user: "user123", thread: "thread123" };
      bookmarkService.createBookmark = vi
        .fn()
        .mockResolvedValue({ bookmark, created: false });

      await addBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Thread already bookmarked",
        data: bookmark,
      });
    });

    it("propagates service errors", async () => {
      req.params.id = "thread123";
      const error = new Error("Thread not found");
      error.statusCode = 404;
      bookmarkService.createBookmark = vi.fn().mockRejectedValue(error);

      await expect(addBookmark(req, res)).rejects.toMatchObject({
        message: "Thread not found",
        statusCode: 404,
      });
    });
  });

  describe("deleteBookmark", () => {
    it("returns 200 with the threadId", async () => {
      req.params.id = "thread123";
      bookmarkService.removeBookmark = vi.fn().mockResolvedValue(undefined);

      await deleteBookmark(req, res);

      expect(bookmarkService.removeBookmark).toHaveBeenCalledWith(
        "user123",
        "thread123",
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Bookmark removed successfully",
        data: { threadId: "thread123" },
      });
    });
  });

  describe("getBookmarks", () => {
    it("returns 200 with the threads array", async () => {
      const threads = [{ _id: "t1", title: "Saved thread" }];
      bookmarkService.getBookmarksByUser = vi.fn().mockResolvedValue(threads);

      await getBookmarks(req, res);

      expect(bookmarkService.getBookmarksByUser).toHaveBeenCalledWith("user123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Bookmarks fetched successfully",
        data: threads,
      });
    });
  });
});
