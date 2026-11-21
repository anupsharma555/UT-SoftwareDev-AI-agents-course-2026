import dotenv from "dotenv";
// ES module imports are hoisted, so load env here to guarantee the key is
// available no matter which module imports this file first.
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import { createAppError } from "./createAppError.js";

// gemini-3.x models are not available on the free tier, so use 2.5.
const AI_MODEL = "gemini-2.5-flash";

let client = null;

// Created lazily, after dotenv has loaded GEMINI_API_KEY.
const getClient = () => {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw createAppError("AI service is not configured", 503);
    }
    client = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1beta" } });
  }
  return client;
};

export const generateText = async ({
  systemInstruction,
  prompt,
  maxOutputTokens = 1024,
}) => {
  const ai = getClient();

  let response;
  try {
    response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        maxOutputTokens,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    const status = error?.status ?? error?.code;
    if (status === 429) {
      throw createAppError("AI service is busy. Please try again shortly.", 429);
    }
    throw createAppError("Failed to generate response. Please try again.", 502);
  }

  const text = response?.text?.trim();
  if (!text) {
    throw createAppError("AI returned an empty response", 502);
  }
  return text;
};
