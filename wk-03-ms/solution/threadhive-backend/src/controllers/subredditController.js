import {
  fetchAllSubreddits,
  createNewSubreddit,
  fetchSubredditWithThreads,
} from "../services/subredditService.js";

// GET /api/subreddits
export const getAllSubreddits = async (req, res) => {
  try {
    const subreddits = await fetchAllSubreddits();

    if (!subreddits || subreddits.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subreddits found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subreddits fetched successfully",
      data: subreddits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching subreddits",
    });
  }
};

export const createSubreddit = async (req, res) => {
  try {
    const { name, description, author } = req.body;

    if (!name || !description || !author) {
      return res.status(400).json({
        success: false,
        message: "Name, description, and author are required.",
      });
    }

    const newSubreddit = await createNewSubreddit(name, description, author);

    if (!newSubreddit) {
      return res.status(409).json({
        success: false,
        message: "Subreddit with this name already exists.",
      });
    }

    res.status(201).json({
      success: true,
      message: "Subreddit created successfully",
      data: newSubreddit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while creating subreddit",
    });
  }
};


export const getSubredditWithThreads = async (req, res) => {
  try {
    const result = await fetchSubredditWithThreads(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Subreddit not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subreddit and its threads fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching subreddit with threads",
    });
  }
};
