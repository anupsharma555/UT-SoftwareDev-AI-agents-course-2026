import { describe, it, expect } from "vitest";
import searchReducer, {
  searchThreadsThunk,
} from "../../../src/reducers/searchSlice";

describe("searchSlice", () => {
  const initialState = {
    results: [],
    query: "",
    loading: false,
    error: null,
  };

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = searchReducer(undefined, { type: "unknown" });
      expect(state).toEqual(initialState);
    });
  });

  describe("searchThreadsThunk", () => {
    it("should set loading and store the query on pending", () => {
      const state = searchReducer(
        initialState,
        searchThreadsThunk.pending("requestId", "react"),
      );

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.query).toBe("react");
    });

    it("should set results and query on fulfilled", () => {
      const mockResults = [
        { _id: "1", title: "Getting Started with React" },
        { _id: "2", title: "React hooks" },
      ];

      const state = searchReducer(
        { ...initialState, loading: true },
        searchThreadsThunk.fulfilled(mockResults, "requestId", "react"),
      );

      expect(state.loading).toBe(false);
      expect(state.results).toEqual(mockResults);
      expect(state.query).toBe("react");
    });

    it("should set error and clear loading on rejected", () => {
      const errorMessage = "Failed to search threads";
      const state = searchReducer(
        { ...initialState, loading: true },
        searchThreadsThunk.rejected(
          null,
          "requestId",
          "react",
          errorMessage,
        ),
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });
});
