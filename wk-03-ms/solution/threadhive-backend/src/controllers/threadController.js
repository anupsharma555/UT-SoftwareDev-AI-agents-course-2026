import {
  fetchAllThreads,
  fetchThreadById,
  createNewThread,
  updateThreadById,
  deleteThreadById,
} from "../services/threadService.js";

// GET /api/threads
export const getAllThreads = async (req, res) => {
  try {
    const threads = await fetchAllThreads();

    if (!threads || threads.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No threads found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Threads fetched successfully",
      data: threads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching threads",
    });
  }
};

// GET /api/threads/:id
export const getThreadByID = async (req, res) => {
  try {
    const thread = await fetchThreadById(req.params.id);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Thread fetched successfully",
      data: thread,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching thread",
    });
  }
};

// POST /api/threads
export const createThread = async (req, res) => {
  try {
    const { title, content, author, subreddit } = req.body;

    if (!title || !content || !author || !subreddit) {
      return res.status(400).json({
        success: false,
        message: "Title, content, author, and subreddit are required.",
      });
    }

    const populatedThread = await createNewThread(
      title,
      content,
      author,
      subreddit,
    );

    if (!populatedThread) {
      return res.status(500).json({
        success: false,
        message: "Failed to create thread",
      });
    }

    res.status(201).json({
      success: true,
      message: "Thread created successfully",
      data: populatedThread,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while creating thread",
    });
  }
};

// PUT /api/threads/:id
export const updateThread = async (req, res) => {
  try {
    const updatedThread = await updateThreadById(req.params.id, req.body);

    if (!updatedThread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Thread updated successfully",
      data: updatedThread,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while updating thread",
    });
  }
};

// DELETE /api/threads/:id
export const deleteThread = async (req, res) => {
  try {
    const deletedThread = await deleteThreadById(req.params.id);

    if (!deletedThread) {
      return res.status(404).json({
        success: false,
        message: "Thread not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Thread deleted successfully",
      data: deletedThread,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting thread",
    });
  }
};
