import {
    saveBookmarkService,
    unsaveBookmarkService,
    getSavedQuestionsService,
    getSavedQuestionIdsService,
} from "../services/bookmarkService.js";

export const saveBookmark = async (req, res) => {
    const userId = req.user.id;
    const { questionId } = req.body;

    const { bookmark, created } = await saveBookmarkService(userId, questionId);

    res.status(created ? 201 : 200).json({
        success: true,
        message: created ? "Question saved" : "Question already saved",
        data: bookmark,
    });
};

export const unsaveBookmark = async (req, res) => {
    const userId = req.user.id;
    const { questionId } = req.params;

    const data = await unsaveBookmarkService(userId, questionId);

    res.status(200).json({
        success: true,
        message: "Question unsaved",
        data,
    });
};

export const getSavedQuestions = async (req, res) => {
    const userId = req.user.id;

    const data = await getSavedQuestionsService(userId);

    res.status(200).json({
        success: true,
        message: "Saved questions fetched successfully",
        data,
    });
};

export const getSavedQuestionIds = async (req, res) => {
    const userId = req.user.id;

    const data = await getSavedQuestionIdsService(userId);

    res.status(200).json({
        success: true,
        message: "Saved question ids fetched successfully",
        data,
    });
};
