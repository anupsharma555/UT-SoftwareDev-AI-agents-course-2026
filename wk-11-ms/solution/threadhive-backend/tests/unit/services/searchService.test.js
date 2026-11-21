import { describe, it, expect, beforeEach, vi } from "vitest";
import { searchThreads } from "../../../src/services/searchService.js";
import Thread from "../../../src/models/Thread.js";

// Mock the Thread model
vi.mock("../../../src/models/Thread.js");

// Build a chainable Thread.find() mock that resolves to `result`
// and exposes spies for each step of the query chain.
function mockFindChain(result = []) {
  const populateInner = vi.fn().mockResolvedValue(result);
  const populateOuter = vi.fn().mockReturnValue({ populate: populateInner });
  const limit = vi.fn().mockReturnValue({ populate: populateOuter });
  const sort = vi.fn().mockReturnValue({ limit });
  const find = vi.fn().mockReturnValue({ sort });

  Thread.find = find;

  return { find, sort, limit, populateOuter, populateInner };
}

describe("searchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("blank / missing query", () => {
    it("returns [] without querying the DB for an empty string", async () => {
      const { find } = mockFindChain();

      const result = await searchThreads("");

      expect(result).toEqual([]);
      expect(find).not.toHaveBeenCalled();
    });

    it("returns [] without querying the DB for whitespace only", async () => {
      const { find } = mockFindChain();

      const result = await searchThreads("   ");

      expect(result).toEqual([]);
      expect(find).not.toHaveBeenCalled();
    });

    it("returns [] without querying the DB when query is undefined", async () => {
      const { find } = mockFindChain();

      const result = await searchThreads(undefined);

      expect(result).toEqual([]);
      expect(find).not.toHaveBeenCalled();
    });
  });

  describe("query building", () => {
    it("runs a case-insensitive $or regex over title and content", async () => {
      const { find } = mockFindChain([]);

      await searchThreads("hello");

      expect(find).toHaveBeenCalledWith({
        $or: [
          { title: { $regex: "hello", $options: "i" } },
          { content: { $regex: "hello", $options: "i" } },
        ],
      });
    });

    it("escapes regex metacharacters so the query is matched literally", async () => {
      const { find } = mockFindChain([]);

      await searchThreads("c++ (test) .*");

      const queryArg = find.mock.calls[0][0];
      const titleRegex = queryArg.$or[0].title.$regex;

      // Metacharacters are backslash-escaped, not left as active regex syntax.
      expect(titleRegex).toBe("c\\+\\+ \\(test\\) \\.\\*");
      // Both fields use the same escaped pattern.
      expect(queryArg.$or[1].content.$regex).toBe(titleRegex);

      // The escaped pattern is a valid literal regex that does not match arbitrary text.
      expect(new RegExp(titleRegex).test("c++ (test) .*")).toBe(true);
      expect(new RegExp(titleRegex).test("cccc")).toBe(false);
    });

    it("trims the query before building the regex", async () => {
      const { find } = mockFindChain([]);

      await searchThreads("  spaced  ");

      expect(find.mock.calls[0][0].$or[0].title.$regex).toBe("spaced");
    });

    it("clamps very long queries to 100 characters", async () => {
      const { find } = mockFindChain([]);
      const longQuery = "a".repeat(250);

      await searchThreads(longQuery);

      expect(find.mock.calls[0][0].$or[0].title.$regex).toBe("a".repeat(100));
    });

    it("sorts newest-first, limits to 50, and populates author + subreddit", async () => {
      const { sort, limit, populateOuter, populateInner } = mockFindChain([]);

      await searchThreads("hello");

      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(limit).toHaveBeenCalledWith(50);
      expect(populateOuter).toHaveBeenCalledWith("author", "name");
      expect(populateInner).toHaveBeenCalledWith("subreddit", "name");
    });

    it("returns the threads produced by the query chain", async () => {
      const threads = [{ _id: "t1", title: "hello world" }];
      mockFindChain(threads);

      const result = await searchThreads("hello");

      expect(result).toEqual(threads);
    });
  });
});
