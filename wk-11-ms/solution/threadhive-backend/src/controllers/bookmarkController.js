import {
  createBookmark,
  removeBookmark,
  getBookmarksByUser,
} from "../services/bookmarkService.js";

export const addBookmark = async (req, res) => {
  const { bookmark, created } = await createBookmark(
    req.user.userId,
    req.params.id,
  );

  res.status(created ? 201 : 200).json({
    success: true,
    message: created
      ? "Thread bookmarked successfully"
      : "Thread already bookmarked",
    data: bookmark,
  });
};

export const deleteBookmark = async (req, res) => {
  await removeBookmark(req.user.userId, req.params.id);

  res.status(200).json({
    success: true,
    message: "Bookmark removed successfully",
    data: { threadId: req.params.id },
  });
};

export const getBookmarks = async (req, res) => {
  const threads = await getBookmarksByUser(req.user.userId);

  res.status(200).json({
    success: true,
    message: "Bookmarks fetched successfully",
    data: threads,
  });
};
