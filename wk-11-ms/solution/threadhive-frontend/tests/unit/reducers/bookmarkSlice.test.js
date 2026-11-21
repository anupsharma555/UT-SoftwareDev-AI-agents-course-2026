import { describe, it, expect } from "vitest";
import bookmarkReducer, {
  fetchBookmarksThunk,
  saveBookmarkThunk,
  removeBookmarkThunk,
} from "../../../src/reducers/bookmarkSlice";

describe("bookmarkSlice", () => {
  const initialState = {
    saved: [],
    savedIds: [],
    loading: false,
    error: null,
  };

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = bookmarkReducer(undefined, { type: "unknown" });
      expect(state).toEqual(initialState);
    });
  });

  describe("fetchBookmarksThunk", () => {
    it("should set loading on pending", () => {
      const state = bookmarkReducer(initialState, fetchBookmarksThunk.pending());
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should fill saved and derive savedIds on fulfilled", () => {
      const threads = [
        { _id: "t1", title: "First" },
        { _id: "t2", title: "Second" },
      ];

      const state = bookmarkReducer(
        { ...initialState, loading: true },
        fetchBookmarksThunk.fulfilled(threads, ""),
      );

      expect(state.loading).toBe(false);
      expect(state.saved).toEqual(threads);
      expect(state.savedIds).toEqual(["t1", "t2"]);
    });

    it("should set error on rejected", () => {
      const state = bookmarkReducer(
        { ...initialState, loading: true },
        fetchBookmarksThunk.rejected(null, "", undefined, "Failed to load"),
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe("Failed to load");
    });
  });

  describe("saveBookmarkThunk", () => {
    it("should add the thread id to savedIds on fulfilled", () => {
      const state = bookmarkReducer(
        initialState,
        saveBookmarkThunk.fulfilled("t1", "", "t1"),
      );

      expect(state.savedIds).toContain("t1");
    });

    it("should not duplicate an already-saved id", () => {
      const previousState = { ...initialState, savedIds: ["t1"] };
      const state = bookmarkReducer(
        previousState,
        saveBookmarkThunk.fulfilled("t1", "", "t1"),
      );

      expect(state.savedIds).toEqual(["t1"]);
    });

    it("should set error on rejected", () => {
      const state = bookmarkReducer(
        initialState,
        saveBookmarkThunk.rejected(null, "", "t1", "Save failed"),
      );

      expect(state.error).toBe("Save failed");
    });
  });

  describe("removeBookmarkThunk", () => {
    it("should drop the id from savedIds and the thread from saved", () => {
      const previousState = {
        saved: [
          { _id: "t1", title: "First" },
          { _id: "t2", title: "Second" },
        ],
        savedIds: ["t1", "t2"],
        loading: false,
        error: null,
      };

      const state = bookmarkReducer(
        previousState,
        removeBookmarkThunk.fulfilled("t1", "", "t1"),
      );

      expect(state.savedIds).toEqual(["t2"]);
      expect(state.saved).toEqual([{ _id: "t2", title: "Second" }]);
    });

    it("should set error on rejected", () => {
      const state = bookmarkReducer(
        initialState,
        removeBookmarkThunk.rejected(null, "", "t1", "Remove failed"),
      );

      expect(state.error).toBe("Remove failed");
    });
  });
});
