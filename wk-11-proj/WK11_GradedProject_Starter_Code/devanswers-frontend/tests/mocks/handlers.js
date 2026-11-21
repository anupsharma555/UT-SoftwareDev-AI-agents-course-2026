import { http, HttpResponse } from "msw";
import {
  mockUsers,
  mockQuestions,
  mockAnswers,
  mockTags,
  mockAuthResponse,
  mockBookmarkedIds,
} from "./mockData";

const BASE_URL = "http://localhost:3001/api";

export const handlers = [
  // ── Auth endpoints ────────────────────────────────────────────────────────
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();

    if (body.email === "alice@example.com" && body.password === "password123") {
      return HttpResponse.json({ data: mockAuthResponse.login });
    }

    return HttpResponse.json(
      { message: "Invalid email or password" },
      { status: 401 },
    );
  }),

  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json();

    if (body.email === "existing@example.com") {
      return HttpResponse.json(
        { message: "Email already exists" },
        { status: 400 },
      );
    }

    return HttpResponse.json({ data: mockAuthResponse.register });
  }),

  // ── Question endpoints ────────────────────────────────────────────────────
  http.get(`${BASE_URL}/questions`, () => {
    return HttpResponse.json({ data: mockQuestions });
  }),

  http.get(`${BASE_URL}/questions/:id`, ({ params }) => {
    const question = mockQuestions.find((q) => q._id === params.id);

    if (!question) {
      return HttpResponse.json(
        { message: "Question not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json({ data: question });
  }),

  http.post(`${BASE_URL}/questions`, async ({ request }) => {
    const body = await request.json();

    const newQuestion = {
      _id: `question-${Date.now()}`,
      ...body,
      voteCount: 0,
      upvotes: [],
      downvotes: [],
      answerCount: 0,
      answers: [],
      author: { _id: body.author, name: mockUsers.user1.name },
      createdAt: new Date().toISOString(),
    };

    return HttpResponse.json({ data: newQuestion }, { status: 201 });
  }),

  http.post(`${BASE_URL}/questions/:id/upvote`, ({ params }) => {
    const question = mockQuestions.find((q) => q._id === params.id);

    if (!question) {
      return HttpResponse.json(
        { message: "Question not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      data: { ...question, voteCount: question.voteCount + 1 },
    });
  }),

  http.post(`${BASE_URL}/questions/:id/downvote`, ({ params }) => {
    const question = mockQuestions.find((q) => q._id === params.id);

    if (!question) {
      return HttpResponse.json(
        { message: "Question not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      data: { ...question, voteCount: question.voteCount - 1 },
    });
  }),

  // ── Answer endpoints ──────────────────────────────────────────────────────
  http.post(
    `${BASE_URL}/questions/:questionId/answers`,
    async ({ request, params }) => {
      const body = await request.json();

      const newAnswer = {
        _id: `answer-${Date.now()}`,
        answerText: body.answerText,
        author: { _id: body.author, name: mockUsers.user1.name },
        voteCount: 0,
        upvotes: [],
        downvotes: [],
        createdAt: new Date().toISOString(),
      };

      return HttpResponse.json({ data: newAnswer }, { status: 201 });
    },
  ),

  http.post(`${BASE_URL}/answers/:id/upvote`, ({ params }) => {
    const answer = mockAnswers.find((a) => a._id === params.id);

    if (!answer) {
      return HttpResponse.json(
        { message: "Answer not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      data: { ...answer, voteCount: answer.voteCount + 1 },
    });
  }),

  http.post(`${BASE_URL}/answers/:id/downvote`, ({ params }) => {
    const answer = mockAnswers.find((a) => a._id === params.id);

    if (!answer) {
      return HttpResponse.json(
        { message: "Answer not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      data: { ...answer, voteCount: answer.voteCount - 1 },
    });
  }),

  // ── Tag endpoints ─────────────────────────────────────────────────────────
  http.get(`${BASE_URL}/tags`, () => {
    return HttpResponse.json({ data: mockTags });
  }),

  http.get(`${BASE_URL}/tags/:tagId/questions`, ({ params }) => {
    const questions = mockQuestions.filter((q) =>
      q.tags.some((t) => t._id === params.tagId),
    );
    return HttpResponse.json({ data: questions });
  }),

  // ── Edit endpoints ───────────────────────────────────────────────────────
  http.put(`${BASE_URL}/questions/:id`, async ({ params, request }) => {
    const question = mockQuestions.find((q) => q._id === params.id);
    if (!question) {
      return HttpResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
    }
    const { title, description, tags } = await request.json();
    // eslint-disable-next-line no-unused-vars
    const { answers, ...rest } = question;
    return HttpResponse.json({
      success: true,
      message: 'Question updated successfully',
      data: {
        ...rest,
        title,
        description,
        tags: tags
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => ({ _id: `tag-${name}`, name })),
        editedAt: '2026-02-01T10:00:00.000Z',
      },
    });
  }),

  http.put(`${BASE_URL}/answers/:answerId`, async ({ params, request }) => {
    const answer = mockAnswers.find((a) => a._id === params.answerId);
    if (!answer) {
      return HttpResponse.json({ success: false, message: 'Answer not found' }, { status: 404 });
    }
    const { answerText } = await request.json();
    return HttpResponse.json({
      success: true,
      message: 'Answer updated successfully',
      data: { ...answer, answerText, editedAt: '2026-02-01T10:00:00.000Z' },
    });
  }),

  // ── Bookmark endpoints ────────────────────────────────────────────────────
  http.get(`${BASE_URL}/bookmarks/ids`, () => {
    return HttpResponse.json({ success: true, data: mockBookmarkedIds });
  }),

  http.get(`${BASE_URL}/bookmarks`, () => {
    const saved = mockQuestions.filter((q) => mockBookmarkedIds.includes(q._id));
    return HttpResponse.json({ success: true, data: saved });
  }),

  http.post(`${BASE_URL}/bookmarks`, async ({ request }) => {
    const { questionId } = await request.json();
    return HttpResponse.json(
      { success: true, data: { questionId, bookmarked: true } },
      { status: 201 },
    );
  }),

  http.delete(`${BASE_URL}/bookmarks/:questionId`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: { questionId: params.questionId, bookmarked: false },
    });
  }),

  // ── User stats endpoint ───────────────────────────────────────────────────
  http.get(`${BASE_URL}/auth/stats/:userId`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        totalQuestions: 3,
        totalAnswers: 5,
        totalVotesReceived: 12,
        reputation: 75,
      },
    });
  }),
];
