import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "../../../src/pages/User/Home";
import { fetchRecentThreads } from "../../../src/services/threadService";
import userEvent from "@testing-library/user-event";

// Mock external service
vi.mock("../../../src/services/threadService", () => ({
    fetchRecentThreads: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => { });
});

describe("Home Component", () => {
    const mockThreads = [
        {
            _id: "t1",
            title: "First Thread",
            content: "Content for first thread",
            author: "u1",
            subredditName: "reactjs",
            upvotedBy: [],
            downvotedBy: [],
        },
        {
            _id: "t2",
            title: "Second Thread",
            content: "Content for second thread",
            author: "u2",
            subredditName: "vitest",
            upvotedBy: [],
            downvotedBy: [],
        },
    ];

    it("renders list of threads", async () => {
        fetchRecentThreads.mockResolvedValueOnce(mockThreads);
        render(<Home />);

        for (const thread of mockThreads) {
            expect(await screen.findByText(thread.title)).toBeInTheDocument();
            expect(screen.getByText(thread.content)).toBeInTheDocument();
        }
    });

    it("renders 'No threads found' if no threads", async () => {
        fetchRecentThreads.mockResolvedValueOnce([]);
        render(<Home />);

        expect(await screen.findByText(/No threads found/i)).toBeInTheDocument();
    });

    it("triggers alert on thread upvote and downvote buttons", async () => {
        fetchRecentThreads.mockResolvedValueOnce(mockThreads);
        render(<Home />);

        // Wait for buttons to appear
        const upvoteBtns = await screen.findAllByRole("button", { name: "Upvote" });
        const downvoteBtns = await screen.findAllByRole("button", { name: "Downvote" });

        // Click buttons
        await userEvent.click(upvoteBtns[0]);
        await userEvent.click(downvoteBtns[0]);

        expect(window.alert).toHaveBeenCalledWith("Upvote clicked!");
        expect(window.alert).toHaveBeenCalledWith("Downvote clicked!");
    });

});
