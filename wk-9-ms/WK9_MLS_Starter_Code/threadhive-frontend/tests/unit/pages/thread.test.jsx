import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse, delay } from "msw";
import { server } from "../../mocks/server";
import ThreadPage from "../../../src/pages/User/ThreadPage";
import threadReducer from "../../../src/reducers/threadListSlice";
import currentThreadReducer from "../../../src/reducers/currentThreadSlice";
import commentReducer from "../../../src/reducers/commentSlice";

const localStorageMock = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

const createTestStore = () => {
  return configureStore({
    reducer: {
      threads: threadReducer,
      currentThread: currentThreadReducer,
      comments: commentReducer,
    },
  });
};

const renderThreadPage = (threadId = "thread-1") => {
  const store = createTestStore();
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/thread/" + threadId]}>
          <Routes>
            <Route path="/thread/:threadId" element={<ThreadPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    ),
  };
};

describe("Thread Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("renders thread details and author", async () => {
    renderThreadPage("thread-1");
    // MSW returns thread-1: "Getting Started with React" by John Doe
    await waitFor(() => {
      expect(
        screen.getByText("Getting Started with React"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("How do I start learning React?"),
    ).toBeInTheDocument();
    // John Doe appears as thread author and also as a comment author
    expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
  });

  it("renders comments and total count", async () => {
    renderThreadPage("thread-1");
    // MSW returns 2 comments for thread-1
    await waitFor(() => {
      expect(screen.getByText("2 total")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Great question! Start with the official docs."),
    ).toBeInTheDocument();
  });

  it("shows 'No comments yet' if there are no comments", async () => {
    renderThreadPage("thread-3");
    // thread-3 has no comments in mock data
    await waitFor(() => {
      expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
    });
  });

  it("renders upvote and downvote buttons for the thread", async () => {
    renderThreadPage("thread-1");
    await waitFor(() => {
      expect(
        screen.getByText("Getting Started with React"),
      ).toBeInTheDocument();
    });
    const upvoteBtns = screen.getAllByLabelText(/upvote/i);
    const downvoteBtns = screen.getAllByLabelText(/downvote/i);
    expect(upvoteBtns.length).toBeGreaterThanOrEqual(1);
    expect(downvoteBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("displays correct vote count for the thread", async () => {
    renderThreadPage("thread-1");
    // thread-1 has voteCount: 15
    await waitFor(() => {
      expect(screen.getByText("15")).toBeInTheDocument();
    });
  });

  it("renders the comment form", async () => {
    renderThreadPage("thread-1");
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/write a comment/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /post comment/i }),
    ).toBeInTheDocument();
  });

  it("renders back to home button", async () => {
    renderThreadPage("thread-1");
    await waitFor(() => {
      expect(
        screen.getByText("Getting Started with React"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /back to home/i }),
    ).toBeInTheDocument();
  });

  it("shows thread not found for invalid thread", async () => {
    renderThreadPage("thread-999");
    await waitFor(() => {
      expect(screen.getByText(/thread not found/i)).toBeInTheDocument();
    });
  });
  describe("Summarize", () => {
    it("shows loading, then the summary above the comment form", async () => {
      server.use(
        http.get("http://localhost:5001/api/threads/:id/summary", async () => {
          await delay(150);
          return HttpResponse.json({
            data: { summary: "AI summary for: Getting Started with React" },
          });
        }),
      );
      const user = userEvent.setup();
      renderThreadPage("thread-1");
      const button = await screen.findByRole("button", { name: "Summarize" });

      await user.click(button);
      expect(
        screen.getByRole("button", { name: /Summarizing/i }),
      ).toBeDisabled();

      const summary = await screen.findByTestId("thread-summary");
      expect(summary).toHaveTextContent(
        "AI summary for: Getting Started with React",
      );
      expect(screen.getByRole("button", { name: "Summarize" })).toBeEnabled();

      const commentBox = screen.getAllByRole("textbox")[0];
      expect(
        summary.compareDocumentPosition(commentBox) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("shows an error and recovers when the summary request fails", async () => {
      server.use(
        http.get("http://localhost:5001/api/threads/:id/summary", () =>
          HttpResponse.json(
            { message: "Failed to generate response. Please try again." },
            { status: 502 },
          ),
        ),
      );
      const user = userEvent.setup();
      renderThreadPage("thread-1");

      await user.click(await screen.findByRole("button", { name: "Summarize" }));

      expect(
        await screen.findByText(/Failed to generate response/i),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("thread-summary")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Summarize" })).toBeEnabled();
      // rest of the page still works
      expect(screen.getByText("2 total")).toBeInTheDocument();
    });
  });
});
