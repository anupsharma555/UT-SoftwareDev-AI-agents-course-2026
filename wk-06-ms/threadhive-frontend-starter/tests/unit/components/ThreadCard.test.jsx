import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ThreadCard from "../../../src/components/ThreadList/ThreadCard";

vi.mock("../../../src/services/userService", () => ({
  getUserName: vi.fn(
    (userId) =>
      ({
        "user-1": "Alice",
        "user-2": "Bob",
      })[userId] ?? "Unknown"
  ),
}));

describe("ThreadCard", () => {
  const thread = {
    title: "JavaScript async/await vs promises",
    content: "When should I use async/await instead of promises?",
    author: "user-1",
    subredditName: "javascript",
    upvotedBy: ["user-2", "user-3"],
    downvotedBy: ["user-4"],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the thread content and metadata from props", () => {
    render(<ThreadCard thread={thread} goBack={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: thread.title })
    ).toBeInTheDocument();
    expect(screen.getByText(thread.content)).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("r/javascript")).toBeInTheDocument();
  });

  it("calculates the vote count from upvotes and downvotes", () => {
    render(<ThreadCard thread={thread} goBack={vi.fn()} />);

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("calls goBack when Back to Home is clicked", async () => {
    const user = userEvent.setup();
    const goBack = vi.fn();
    render(<ThreadCard thread={thread} goBack={goBack} />);

    await user.click(screen.getByRole("button", { name: /back to home/i }));

    expect(goBack).toHaveBeenCalledOnce();
  });

  it("alerts when the upvote and downvote buttons are clicked", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<ThreadCard thread={thread} goBack={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /upvote/i }));
    await user.click(screen.getByRole("button", { name: /downvote/i }));

    expect(alertSpy).toHaveBeenNthCalledWith(1, "Upvote clicked!");
    expect(alertSpy).toHaveBeenNthCalledWith(2, "Downvote clicked!");
  });
});
