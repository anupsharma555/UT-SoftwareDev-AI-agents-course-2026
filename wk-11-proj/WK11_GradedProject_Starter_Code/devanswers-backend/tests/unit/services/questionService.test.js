import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAllQuestionsService,
  getQuestionByIdService,
  createQuestionService,
  updateQuestionService,
  deleteQuestionService,
  upvoteQuestionService,
  downvoteQuestionService,
} from "../../../src/services/questionService.js";
import Question from "../../../src/models/Question.js";
import Answer from "../../../src/models/Answer.js";
import Tag from "../../../src/models/Tag.js";
import { handleVote } from "../../../src/services/voteService.js";

// Mock the models and services
// Mock voteService since questionService delegates vote logic to it
vi.mock("../../../src/models/Question.js");
vi.mock("../../../src/models/Answer.js");
vi.mock("../../../src/models/Tag.js");
vi.mock("../../../src/models/Bookmark.js");
vi.mock("../../../src/services/voteService.js");

describe("questionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllQuestionsService", () => {
    // Success case
    it("should return all questions with populated fields", async () => {
      // Arrange
      const mockQuestions = [
        {
          _id: "question1",
          title: "Question 1",
          author: { _id: "user1", name: "User 1" },
          tags: [{ _id: "tag1", name: "javascript" }],
        },
      ];

      Question.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockResolvedValue(mockQuestions),
          }),
        }),
      });
      Answer.countDocuments = vi.fn().mockResolvedValue(3);

      // Act
      const result = await getAllQuestionsService();

      // Assert
      expect(Question.find).toHaveBeenCalledWith({});
      expect(result).toEqual([{ ...mockQuestions[0], answerCount: 3 }]);
      expect(result).toHaveLength(1);
    });

    // Edge case - sorted by createdAt
    it("should sort questions by createdAt descending", async () => {
      // Arrange
      const sortSpy = vi.fn().mockResolvedValue([{ _id: "q1" }]);

      Question.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: sortSpy,
          }),
        }),
      });
      Answer.countDocuments = vi.fn().mockResolvedValue(0);

      // Act
      await getAllQuestionsService();

      // Assert
      // _id is a tiebreaker for questions created in the same millisecond
      expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    });

    // Error case - no questions found
    it("should throw 404 error when no questions exist", async () => {
      // Arrange
      Question.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act & Assert
      await expect(getAllQuestionsService()).rejects.toThrow(
        "No questions found",
      );
      await expect(getAllQuestionsService()).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    // Error case - null result
    it("should throw 404 error when result is null", async () => {
      // Arrange
      Question.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockResolvedValue(null),
          }),
        }),
      });

      // Act & Assert
      await expect(getAllQuestionsService()).rejects.toThrow(
        "No questions found",
      );
    });
  });

  describe("getQuestionByIdService", () => {
    // Success case
    it("should return question by id with populated fields and answers", async () => {
      // Arrange
      const mockPopulatedQuestion = {
        _id: "question123",
        title: "Test Question",
        author: { _id: "user1", name: "User 1" },
        tags: [{ _id: "tag1", name: "javascript" }],
        views: 1,
        toObject: vi.fn().mockReturnValue({
          _id: "question123",
          title: "Test Question",
          author: { _id: "user1", name: "User 1" },
          views: 1,
        }),
      };

      const mockAnswers = [{ _id: "answer1", answerText: "Test Answer" }];

      // Views are incremented and the document fetched in one atomic query
      Question.findByIdAndUpdate = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockPopulatedQuestion),
        }),
      });

      Answer.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockAnswers),
      });

      // Act
      const result = await getQuestionByIdService("question123");

      // Assert
      expect(Question.findByIdAndUpdate).toHaveBeenCalledWith(
        "question123",
        { $inc: { views: 1 } },
        { new: true },
      );
      expect(result.answers).toEqual(mockAnswers);
    });

    // Edge case - view increment
    it("should increment views count atomically", async () => {
      // Arrange
      const mockPopulated = {
        _id: "question123",
        views: 6,
        toObject: vi.fn().mockReturnValue({ _id: "question123", views: 6 }),
      };

      Question.findByIdAndUpdate = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockPopulated),
        }),
      });

      Answer.find = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      });

      // Act
      const result = await getQuestionByIdService("question123");

      // Assert
      expect(Question.findByIdAndUpdate).toHaveBeenCalledWith(
        "question123",
        { $inc: { views: 1 } },
        { new: true },
      );
      expect(result.views).toBe(6);
    });

    // Error case - question not found
    it("should throw 404 error if question not found", async () => {
      // Arrange
      Question.findByIdAndUpdate = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(null),
        }),
      });

      // Act & Assert
      await expect(getQuestionByIdService("nonexistent")).rejects.toThrow(
        "Question not found",
      );
      await expect(getQuestionByIdService("nonexistent")).rejects.toMatchObject(
        {
          statusCode: 404,
        },
      );
    });

    // Failure case - database error
    it("should propagate database errors", async () => {
      // Arrange
      Question.findByIdAndUpdate = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockRejectedValue(new Error("Database error")),
        }),
      });

      // Act & Assert
      await expect(getQuestionByIdService("question123")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("createQuestionService", () => {
    // Success case
    it("should create and return a new question with tags", async () => {
      // Arrange
      Tag.findOne = vi.fn().mockResolvedValue(null);

      const mockTagInstance = {
        _id: "tag123",
        save: vi.fn().mockResolvedValue(true),
      };
      Tag.mockImplementation(function () { return mockTagInstance; });

      const mockQuestionInstance = {
        _id: "question123",
        title: "New Question",
        description: "Question description",
        tags: ["tag123", "tag123"],
        author: "user123",
        save: vi.fn().mockResolvedValue(true),
      };
      Question.mockImplementation(function () { return mockQuestionInstance; });

      // Act
      const result = await createQuestionService({
        title: "New Question",
        description: "Question description",
        tags: "javascript, nodejs",
        author: "user123",
      });

      // Assert
      expect(mockQuestionInstance.save).toHaveBeenCalled();
      expect(result).toEqual(mockQuestionInstance);
    });

    // Edge case - reuse existing tags
    it("should reuse existing tags", async () => {
      // Arrange
      const existingTag = { _id: "existingTag123", name: "javascript" };
      Tag.findOne = vi
        .fn()
        .mockResolvedValueOnce(existingTag)
        .mockResolvedValueOnce(null);

      const mockNewTag = {
        _id: "newTag123",
        save: vi.fn().mockResolvedValue(true),
      };
      Tag.mockImplementation(function () { return mockNewTag; });

      const mockQuestion = {
        _id: "question123",
        tags: ["existingTag123", "newTag123"],
        save: vi.fn().mockResolvedValue(true),
      };
      Question.mockImplementation(function () { return mockQuestion; });

      // Act
      await createQuestionService({
        title: "Test",
        description: "Test",
        tags: "javascript, new-tag",
        author: "user123",
      });

      // Assert
      expect(Tag.findOne).toHaveBeenCalledTimes(2);
      expect(mockNewTag.save).toHaveBeenCalled();
    });

    // Edge case - trim whitespace from tags
    it("should handle tags with extra whitespace", async () => {
      // Arrange
      Tag.findOne = vi.fn().mockResolvedValue(null);
      Tag.mockImplementation(function () { return ({
        _id: "tag123",
        save: vi.fn().mockResolvedValue(true),
      }); });

      Question.mockImplementation(function () { return ({
        _id: "q123",
        save: vi.fn().mockResolvedValue(true),
      }); });

      // Act
      await createQuestionService({
        title: "Test",
        description: "Test",
        tags: "  javascript  ,  nodejs  ",
        author: "user123",
      });

      // Assert
      expect(Tag.findOne).toHaveBeenCalledWith({ name: "javascript" });
      expect(Tag.findOne).toHaveBeenCalledWith({ name: "nodejs" });
    });
  });

  describe("updateQuestionService", () => {
    const QUESTION_ID = "507f1f77bcf86cd799439011";
    const author = { id: "user123", isAdmin: false };

    // A thenable stand-in for a Mongoose query: .populate() chains, awaiting resolves to `result`.
    const populatedQuery = (result) => {
      const query = {
        populate: vi.fn(),
        then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
      };
      query.populate.mockReturnValue(query);
      return query;
    };

    const existingQuestion = (overrides = {}) => ({
      _id: QUESTION_ID,
      title: "Old Title",
      description: "Old Description",
      tags: [{ toString: () => "oldTag" }],
      author: { toString: () => "user123" },
      ...overrides,
    });

    beforeEach(() => {
      Tag.findOne = vi.fn().mockResolvedValue({ _id: "tag1" });
      Question.findById = vi.fn().mockResolvedValue(existingQuestion());
    });

    it("updates, sets editedAt and returns the populated question", async () => {
      const updated = { _id: QUESTION_ID, title: "Updated Title", editedAt: new Date() };
      const query = populatedQuery(updated);
      Question.findByIdAndUpdate = vi.fn().mockReturnValue(query);

      const result = await updateQuestionService(
        QUESTION_ID,
        "Updated Title",
        "Updated Description",
        "tag1, tag2",
        author,
      );

      expect(Question.findById).toHaveBeenCalledWith(QUESTION_ID);
      expect(Question.findByIdAndUpdate).toHaveBeenCalledWith(
        QUESTION_ID,
        expect.objectContaining({
          title: "Updated Title",
          description: "Updated Description",
          tags: ["tag1", "tag1"],
          editedAt: expect.any(Date),
        }),
        { new: true },
      );
      expect(query.populate).toHaveBeenCalledWith({ path: "author", select: "name" });
      expect(query.populate).toHaveBeenCalledWith("tags");
      expect(result).toEqual(updated);
    });

    it("trims the title and description before saving", async () => {
      Question.findByIdAndUpdate = vi.fn().mockReturnValue(populatedQuery({}));

      await updateQuestionService(QUESTION_ID, "  New  ", "  Body  ", "a", author);

      expect(Question.findByIdAndUpdate).toHaveBeenCalledWith(
        QUESTION_ID,
        expect.objectContaining({ title: "New", description: "Body" }),
        { new: true },
      );
    });

    it("ignores empty tag segments and removes duplicates", async () => {
      Question.findByIdAndUpdate = vi.fn().mockReturnValue(populatedQuery({}));

      await updateQuestionService(QUESTION_ID, "T", "D", "a, ,b,, a", author);

      expect(Tag.findOne).toHaveBeenCalledTimes(2);
      expect(Tag.findOne).toHaveBeenCalledWith({ name: "a" });
      expect(Tag.findOne).toHaveBeenCalledWith({ name: "b" });
    });

    it("does not set editedAt when nothing changed", async () => {
      Question.findById = vi
        .fn()
        .mockResolvedValueOnce(
          existingQuestion({
            title: "Same",
            description: "Same body",
            tags: [{ toString: () => "tag1" }],
          }),
        )
        .mockReturnValueOnce(populatedQuery({ _id: QUESTION_ID, title: "Same" }));
      Question.findByIdAndUpdate = vi.fn();

      const result = await updateQuestionService(QUESTION_ID, "Same", "Same body", "tag1", author);

      expect(Question.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(result).toEqual({ _id: QUESTION_ID, title: "Same" });
    });

    it("throws 400 for a malformed question id", async () => {
      await expect(
        updateQuestionService("not-an-id", "T", "D", "tag", author),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(Question.findById).not.toHaveBeenCalled();
    });

    it("throws 404 if the question is not found", async () => {
      Question.findById = vi.fn().mockResolvedValue(null);

      await expect(
        updateQuestionService(QUESTION_ID, "T", "D", "tag", author),
      ).rejects.toMatchObject({ message: "Question not found", statusCode: 404 });
    });

    it("throws 403 if the user is not the author", async () => {
      await expect(
        updateQuestionService(QUESTION_ID, "Hacked", "Hacked", "tag", {
          id: "otherUser",
          isAdmin: false,
        }),
      ).rejects.toMatchObject({
        message: "Not authorized to update this question",
        statusCode: 403,
      });
      expect(Tag.findOne).not.toHaveBeenCalled();
    });

    it("throws 403 for an admin who is not the author", async () => {
      await expect(
        updateQuestionService(QUESTION_ID, "Hacked", "Hacked", "tag", {
          id: "adminUser",
          isAdmin: true,
        }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it.each([
      ["blank title", ["   ", "D", "tag"], "Title is required"],
      ["missing title", [undefined, "D", "tag"], "Title is required"],
      ["blank description", ["T", "  ", "tag"], "Description is required"],
      ["missing tags", ["T", "D", undefined], "At least one tag is required"],
      ["non-string tags", ["T", "D", ["a"]], "At least one tag is required"],
      ["empty tags string", ["T", "D", ""], "At least one tag is required"],
      ["tags of only commas", ["T", "D", " , ,, "], "At least one tag is required"],
    ])("throws 400 for %s and creates no tags", async (_name, [title, description, tags], message) => {
      Question.findByIdAndUpdate = vi.fn();

      await expect(
        updateQuestionService(QUESTION_ID, title, description, tags, author),
      ).rejects.toMatchObject({ message, statusCode: 400 });
      expect(Tag.findOne).not.toHaveBeenCalled();
      expect(Question.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe("deleteQuestionService", () => {
    // Success case - author deletes
    it("should delete question when user is the author", async () => {
      // Arrange
      const mockQuestion = {
        _id: "question123",
        author: { toString: () => "user123" },
        title: "Test Question",
      };

      Question.findById = vi.fn().mockResolvedValue(mockQuestion);
      Question.findByIdAndDelete = vi.fn().mockResolvedValue(mockQuestion);
      Answer.deleteMany = vi.fn().mockResolvedValue({ deletedCount: 2 });

      const loggedInUser = { id: "user123", isAdmin: false };

      // Act
      const result = await deleteQuestionService("question123", loggedInUser);

      // Assert
      expect(Question.findByIdAndDelete).toHaveBeenCalledWith("question123");
      expect(Answer.deleteMany).toHaveBeenCalledWith({
        questionId: "question123",
      });
      expect(result).toEqual(mockQuestion);
    });

    // Success case - admin deletes
    it("should delete question when user is an admin", async () => {
      // Arrange
      const mockQuestion = {
        _id: "question123",
        author: { toString: () => "author456" },
      };

      Question.findById = vi.fn().mockResolvedValue(mockQuestion);
      Question.findByIdAndDelete = vi.fn().mockResolvedValue(mockQuestion);
      Answer.deleteMany = vi.fn().mockResolvedValue({});

      const loggedInUser = { id: "admin789", isAdmin: true };

      // Act
      const result = await deleteQuestionService("question123", loggedInUser);

      // Assert
      expect(Question.findByIdAndDelete).toHaveBeenCalledWith("question123");
      expect(result).toEqual(mockQuestion);
    });

    // Error case - not authorized
    it("should throw 403 error when user is not authorized", async () => {
      // Arrange
      const mockQuestion = {
        _id: "question123",
        author: { toString: () => "author456" },
      };

      Question.findById = vi.fn().mockResolvedValue(mockQuestion);

      const loggedInUser = { id: "otherUser789", isAdmin: false };

      // Act & Assert
      await expect(
        deleteQuestionService("question123", loggedInUser),
      ).rejects.toThrow("Not authorized to delete this question");
      await expect(
        deleteQuestionService("question123", loggedInUser),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    // Error case - question not found
    it("should throw 404 error for non-existent question", async () => {
      // Arrange
      Question.findById = vi.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(
        deleteQuestionService("nonexistent", { id: "user123", isAdmin: false }),
      ).rejects.toThrow("Question not found");
      await expect(
        deleteQuestionService("nonexistent", { id: "user123", isAdmin: false }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    // Edge case - deletes related answers
    it("should delete related answers when deleting a question", async () => {
      // Arrange
      const mockQuestion = {
        _id: "question123",
        author: { toString: () => "user123" },
      };

      Question.findById = vi.fn().mockResolvedValue(mockQuestion);
      Question.findByIdAndDelete = vi.fn().mockResolvedValue(mockQuestion);
      Answer.deleteMany = vi.fn().mockResolvedValue({ deletedCount: 3 });

      // Act
      await deleteQuestionService("question123", {
        id: "user123",
        isAdmin: false,
      });

      // Assert
      expect(Answer.deleteMany).toHaveBeenCalledWith({
        questionId: "question123",
      });
    });
  });

  describe("upvoteQuestionService", () => {
    // Success case
    it("should call handleVote with correct parameters", async () => {
      // Arrange
      const mockDocument = {
        upvotes: ["user123"],
        downvotes: [],
        voteCount: 1,
      };
      handleVote.mockResolvedValue(mockDocument);

      // Act
      const result = await upvoteQuestionService("questionId", "user123");

      // Assert
      expect(handleVote).toHaveBeenCalledWith(
        Question,
        "questionId",
        "user123",
        "upvote",
      );
      expect(result).toEqual(mockDocument);
    });

    // Error case - handleVote returns null
    it("should throw error when handleVote returns null", async () => {
      // Arrange
      handleVote.mockResolvedValue(null);

      // Act & Assert
      await expect(
        upvoteQuestionService("questionId", "user123"),
      ).rejects.toThrow("Failed to upvote question");
    });
  });

  describe("downvoteQuestionService", () => {
    // Success case
    it("should call handleVote with correct parameters", async () => {
      // Arrange
      const mockDocument = {
        upvotes: [],
        downvotes: ["user123"],
        voteCount: -1,
      };
      handleVote.mockResolvedValue(mockDocument);

      // Act
      const result = await downvoteQuestionService("questionId", "user123");

      // Assert
      expect(handleVote).toHaveBeenCalledWith(
        Question,
        "questionId",
        "user123",
        "downvote",
      );
      expect(result).toEqual(mockDocument);
    });

    // Error case - handleVote returns null
    it("should throw error when handleVote returns null", async () => {
      // Arrange
      handleVote.mockResolvedValue(null);

      // Act & Assert
      await expect(
        downvoteQuestionService("questionId", "user123"),
      ).rejects.toThrow("Failed to downvote question");
    });
  });
});
