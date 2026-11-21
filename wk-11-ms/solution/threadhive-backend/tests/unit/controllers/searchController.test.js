import { describe, it, expect, beforeEach, vi } from "vitest";
import { searchThreads } from "../../../src/controllers/searchController.js";
import * as searchService from "../../../src/services/searchService.js";

// Mock the search service
vi.mock("../../../src/services/searchService.js");

describe("searchController", () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      query: {},
      user: { userId: "user123" },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it("reads req.query.q and returns the success envelope with 200", async () => {
    req.query.q = "bookmarks";
    const mockResults = [
      { _id: "thread1", title: "Bookmarks guide" },
      { _id: "thread2", title: "More bookmarks" },
    ];

    searchService.searchThreads = vi.fn().mockResolvedValue(mockResults);

    await searchThreads(req, res);

    expect(searchService.searchThreads).toHaveBeenCalledWith("bookmarks");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Search results fetched successfully",
      data: mockResults,
    });
  });

  it("returns 200 with an empty array when the service finds nothing", async () => {
    req.query.q = "zzzznomatch";
    searchService.searchThreads = vi.fn().mockResolvedValue([]);

    await searchThreads(req, res);

    expect(searchService.searchThreads).toHaveBeenCalledWith("zzzznomatch");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Search results fetched successfully",
      data: [],
    });
  });

  it("passes an undefined query through to the service when q is missing", async () => {
    searchService.searchThreads = vi.fn().mockResolvedValue([]);

    await searchThreads(req, res);

    expect(searchService.searchThreads).toHaveBeenCalledWith(undefined);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("propagates service errors", async () => {
    req.query.q = "bookmarks";
    searchService.searchThreads = vi
      .fn()
      .mockRejectedValue(new Error("Service error"));

    await expect(searchThreads(req, res)).rejects.toThrow("Service error");
  });
});
