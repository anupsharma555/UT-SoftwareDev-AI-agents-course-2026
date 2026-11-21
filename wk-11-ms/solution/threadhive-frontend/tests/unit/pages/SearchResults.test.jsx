import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import SearchResults from "../../../src/pages/Search/SearchResults";
import searchReducer from "../../../src/reducers/searchSlice";

// Renders with the real slice + thunk so the MSW handler drives results.
const renderWithRealStore = (path) => {
  const store = configureStore({ reducer: { search: searchReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <SearchResults />
      </MemoryRouter>
    </Provider>,
  );
};

// Renders with a fixed search state to assert a specific UI state.
const renderWithState = (path, searchState) => {
  const store = configureStore({ reducer: { search: () => searchState } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <SearchResults />
      </MemoryRouter>
    </Provider>,
  );
};

describe("SearchResults page", () => {
  it("reads the query from the URL into the heading", () => {
    renderWithState("/search?q=hello%20world", {
      results: [],
      query: "",
      loading: false,
      error: null,
    });

    expect(
      screen.getByRole("heading", { name: /Results for "hello world"/i }),
    ).toBeInTheDocument();
  });

  it("renders matching result cards for the URL query", async () => {
    renderWithRealStore("/search?q=react");

    expect(
      await screen.findByText("Getting Started with React"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Results for "react"/i }),
    ).toBeInTheDocument();
  });

  it("renders the empty state when nothing matches", async () => {
    renderWithRealStore("/search?q=zzznomatch");

    expect(
      await screen.findByText(/No results for "zzznomatch"/i),
    ).toBeInTheDocument();
  });

  it("renders the loading state while a search is pending", () => {
    renderWithState("/search?q=react", {
      results: [],
      query: "react",
      loading: true,
      error: null,
    });

    expect(screen.getByText(/searching/i)).toBeInTheDocument();
  });
});
