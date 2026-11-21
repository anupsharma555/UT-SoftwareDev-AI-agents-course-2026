import {
    addBookmarkService,
    removeBookmarkService,
    getBookmarkedIdsService,
    getBookmarkedQuestionsService,
} from "../services/bookmarkService.js";

export const addBookmark = async (req, res) => {
    const { questionId } = req.body;
    const { created } = await addBookmarkService(req.user.id, questionId);

    res.status(created ? 201 : 200).json({
        success: true,
        message: "Question bookmarked successfully",
        data: { questionId, bookmarked: true },
    });
};

export const removeBookmark = async (req, res) => {
    const { questionId } = req.params;
    await removeBookmarkService(req.user.id, questionId);

    res.status(200).json({
        success: true,
        message: "Bookmark removed successfully",
        data: { questionId, bookmarked: false },
    });
};

export const getBookmarkIds = async (req, res) => {
    const ids = await getBookmarkedIdsService(req.user.id);

    res.status(200).json({
        success: true,
        message: "Bookmarks fetched successfully",
        data: ids,
    });
};

export const getBookmarks = async (req, res) => {
    const questions = await getBookmarkedQuestionsService(req.user.id);

    res.status(200).json({
        success: true,
        message: "Bookmarks fetched successfully",
        data: questions,
    });
};
