import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import { createAppError } from "../utils/createAppError.js";

const MIN_ANSWERS_TO_SUMMARIZE = 3;
const MAX_ANSWERS_IN_PROMPT = 20;
const MAX_CHARS_PER_ANSWER = 1500;

const questionSuggestionsSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    tags: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 5,
    },
  },
  required: ["title", "description", "tags"],
};

export const improveQuestionQualityService = async ({
  title,
  description,
  tags,
}) => {
  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    typeof tags !== "string"
  ) {
    throw createAppError(
      "Title, description, and tags are required to improve a question",
      400,
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    throw createAppError("Gemini API key is not configured", 500);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      "Improve this developer question so it is clear, specific, and easy to answer.",
      "Preserve the author's intent and technical details. Do not invent facts.",
      "Return a concise title, a well-structured description, and up to five relevant tags.",
      "Input tags are comma-separated; return tag names without a leading #.",
      "",
      JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    ].join("\n"),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: questionSuggestionsSchema,
      maxOutputTokens: 512,
      thinkingConfig: { thinkingBudget: 0 },
      httpOptions: { timeout: 20000 },
    },
  });

  let suggestions;
  try {
    suggestions = JSON.parse(response.text);
  } catch {
    throw createAppError("Gemini returned invalid question suggestions", 502);
  }

  if (
    typeof suggestions.title !== "string" ||
    !suggestions.title.trim() ||
    typeof suggestions.description !== "string" ||
    !suggestions.description.trim() ||
    !Array.isArray(suggestions.tags) ||
    suggestions.tags.length === 0 ||
    suggestions.tags.some((tag) => typeof tag !== "string" || !tag.trim())
  ) {
    throw createAppError("Gemini returned invalid question suggestions", 502);
  }

  return {
    title: suggestions.title,
    description: suggestions.description,
    tags: suggestions.tags.slice(0, 5).join(", "),
  };
};

export const summarizeAnswersService = async (questionId) => {
  if (!mongoose.isValidObjectId(questionId)) {
    throw createAppError("Invalid question id", 400);
  }

  if (!process.env.GEMINI_API_KEY) {
    throw createAppError("Gemini API key is not configured", 500);
  }

  const question = await Question.findById(questionId).select(
    "title description",
  );
  if (!question) {
    throw createAppError("Question not found", 404);
  }

  const answers = await Answer.find({ questionId })
    .sort({ voteCount: -1, createdAt: 1 })
    .select("answerText");
  if (answers.length < MIN_ANSWERS_TO_SUMMARIZE) {
    throw createAppError(
      `At least ${MIN_ANSWERS_TO_SUMMARIZE} answers are required to summarize`,
      400,
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      "Summarize the answers below to this developer question as a TL;DR of 3-5 sentences.",
      "Capture the main approaches and any consensus or disagreement. Use only the provided content.",
      "Respond with plain text only: no markdown, bullet points, or headings.",
      "",
      `Question title: ${question.title}`,
      `Question description: ${question.description}`,
      "",
      ...answers
        .slice(0, MAX_ANSWERS_IN_PROMPT)
        .map(
          (answer, index) =>
            `Answer ${index + 1}: ${answer.answerText.slice(0, MAX_CHARS_PER_ANSWER)}`,
        ),
    ].join("\n"),
    config: {
      maxOutputTokens: 400,
      thinkingConfig: { thinkingBudget: 0 },
      httpOptions: { timeout: 20000 },
    },
  });

  const summary = response.text?.trim();
  if (!summary) {
    throw createAppError("Gemini returned an empty summary", 502);
  }

  return summary;
};
