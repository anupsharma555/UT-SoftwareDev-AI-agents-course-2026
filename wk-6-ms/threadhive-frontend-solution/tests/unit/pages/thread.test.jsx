import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Thread from "../../../src/pages/User/ThreadPage";
import { fetchCommentsForThread } from "../../../src/services/commentService";
import userEvent from "@testing-library/user-event";

// Mock external services
vi.mock("../../../src/services/commentService", () => ({
    fetchCommentsForThread: vi.fn(),
}));

vi.mock("../../../src/services/userService", () => ({
    getUserName: vi.fn((userId) => `User ${userId}`),
}));

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => { });
});

describe("Thread Component", () => {
    const sampleThread = {
        _id: "t1",
        title: "Sample Thread Title",
        content: "This is a sample thread content.",
        author: "u1",
        subredditName: "reactjs",
        upvotedBy: ["u2", "u3"],
        downvotedBy: ["u4"],
    };

    const mockComments = [
        {
            user: "u2",
            content: "This is the first comment.",
            upvotedBy: ["u1"],
            downvotedBy: [],
        },
        {
            user: "u3",
            content: "This is another comment.",
            upvotedBy: [],
            downvotedBy: ["u4"],
        },
    ];

    it("renders thread details and author", async () => {
        fetchCommentsForThread.mockResolvedValueOnce(mockComments);
        render(<Thread thread={sampleThread} goBack={vi.fn()} />);

        expect(await screen.findByText(sampleThread.title)).toBeInTheDocument();
        expect(screen.getByText(sampleThread.content)).toBeInTheDocument();
        expect(screen.getByText(`User ${sampleThread.author}`)).toBeInTheDocument();
    });

    it("renders comments and total count", async () => {
        fetchCommentsForThread.mockResolvedValueOnce(mockComments);
        render(<Thread thread={sampleThread} goBack={vi.fn()} />);

        for (const comment of mockComments) {
            expect(await screen.findByText(comment.content)).toBeInTheDocument();
            expect(screen.getByText(`User ${comment.user}`)).toBeInTheDocument();
        }

        expect(await screen.findByText(`${mockComments.length} total`)).toBeInTheDocument();
    });

    it("shows 'No comments yet' if there are no comments", async () => {
        fetchCommentsForThread.mockResolvedValueOnce([]);
        render(<Thread thread={sampleThread} goBack={vi.fn()} />);

        expect(await screen.findByText(/No comments yet/i)).toBeInTheDocument();
    });

    it("triggers alert on comment upvote and downvote buttons", async () => {
        fetchCommentsForThread.mockResolvedValueOnce(mockComments);
        render(<Thread thread={sampleThread} goBack={vi.fn()} />);

        // Find the first comment card by its content
        const commentContent = await screen.findByText(mockComments[0].content);
        const firstCommentCard = commentContent.closest('.card');


        // Scope queries to within the first comment
        const upvoteBtn = within(firstCommentCard).getByRole("button", { name: "Upvote" });
        const downvoteBtn = within(firstCommentCard).getByRole("button", { name: "Downvote" });

        await userEvent.click(upvoteBtn);
        await userEvent.click(downvoteBtn);

        expect(window.alert).toHaveBeenCalledWith("Upvote clicked!");
        expect(window.alert).toHaveBeenCalledWith("Downvote clicked!");
    });

    it("calls alert when posting a comment", async () => {
        fetchCommentsForThread.mockResolvedValueOnce(mockComments);
        render(<Thread thread={sampleThread} goBack={vi.fn()} />);

        const textarea = await screen.findByPlaceholderText(/write a comment/i);
        const postBtn = screen.getByRole("button", { name: /post comment/i });

        await userEvent.type(textarea, "New test comment");
        await userEvent.click(postBtn);

        expect(window.alert).toHaveBeenCalledWith("Post Comment clicked!");
    });

    // SingleThreadCard
    it("displays correct vote count for the thread", () => {
        fetchCommentsForThread.mockResolvedValueOnce([]);
        render(<Thread thread={sampleThread} goBack={vi.fn()} />);

        const voteCount = sampleThread.upvotedBy.length - sampleThread.downvotedBy.length;
        expect(screen.getByText(voteCount.toString())).toBeInTheDocument();
    });

    it("calls alert when clicking upvote/downvote buttons on the thread", async () => {
        fetchCommentsForThread.mockResolvedValueOnce([]);
        render(<Thread thread={sampleThread} goBack={vi.fn()} />);

        const upvoteBtn = screen.getByRole("button", { name: /Upvote/i });
        const downvoteBtn = screen.getByRole("button", { name: /Downvote/i });

        await userEvent.click(upvoteBtn);
        await userEvent.click(downvoteBtn);

        expect(window.alert).toHaveBeenCalledWith("Upvote clicked!");
        expect(window.alert).toHaveBeenCalledWith("Downvote clicked!");
    });

    it("calls goBack function when back button is clicked", async () => {
        fetchCommentsForThread.mockResolvedValueOnce([]);
        const mockGoBack = vi.fn();
        render(<Thread thread={sampleThread} goBack={mockGoBack} />);

        const backBtn = screen.getByRole("button", { name: /Back to Home/i });
        await userEvent.click(backBtn);

        expect(mockGoBack).toHaveBeenCalled();
    });
});
