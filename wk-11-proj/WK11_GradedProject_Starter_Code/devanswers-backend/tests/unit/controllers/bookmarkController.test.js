import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addBookmark,
  removeBookmark,
  getBookmarkIds,
  getBookmarks,
} from "../../../src/controllers/bookmarkController.js";
import {
  addBookmarkService,
  removeBookmarkService,
  getBookmarkedIdsService,
  getBookmarkedQuestionsService,
} from "../../../src/services/bookmarkService.js";

vi.mock("../../../src/services/bookmarkService.js");

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("bookmarkController", () => {
  let res;
  const req = { user: { id: "user1" }, body: {}, params: {} };

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  it("addBookmark responds 201 when newly saved", async () => {
    addBookmarkService.mockResolvedValue({ created: true });

    await addBookmark({ ...req, body: { questionId: "q1" } }, res);

    expect(addBookmarkService).toHaveBeenCalledWith("user1", "q1");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Question bookmarked successfully",
      data: { questionId: "q1", bookmarked: true },
    });
  });

  it("addBookmark responds 200 when already saved", async () => {
    addBookmarkService.mockResolvedValue({ created: false });

    await addBookmark({ ...req, body: { questionId: "q1" } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("removeBookmark responds 200 with bookmarked: false", async () => {
    removeBookmarkService.mockResolvedValue(undefined);

    await removeBookmark({ ...req, params: { questionId: "q1" } }, res);

    expect(removeBookmarkService).toHaveBeenCalledWith("user1", "q1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Bookmark removed successfully",
      data: { questionId: "q1", bookmarked: false },
    });
  });

  it("getBookmarkIds returns the ids in the envelope", async () => {
    getBookmarkedIdsService.mockResolvedValue(["q2", "q1"]);

    await getBookmarkIds(req, res);

    expect(getBookmarkedIdsService).toHaveBeenCalledWith("user1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Bookmarks fetched successfully",
      data: ["q2", "q1"],
    });
  });

  it("getBookmarks returns saved questions in the envelope", async () => {
    const questions = [{ _id: "q1", answerCount: 0 }];
    getBookmarkedQuestionsService.mockResolvedValue(questions);

    await getBookmarks(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Bookmarks fetched successfully",
      data: questions,
    });
  });
});
