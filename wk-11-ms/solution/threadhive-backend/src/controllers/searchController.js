import { searchThreads as searchThreadsService } from "../services/searchService.js";

// GET /api/search/threads?q=<query>
export const searchThreads = async (req, res) => {
  const threads = await searchThreadsService(req.query.q);
  res.status(200).json({
    success: true,
    message: "Search results fetched successfully",
    data: threads,
  });
};
