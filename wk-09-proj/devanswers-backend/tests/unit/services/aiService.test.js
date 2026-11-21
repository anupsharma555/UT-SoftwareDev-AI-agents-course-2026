import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { generateContentMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: generateContentMock },
  })),
}));

import { GoogleGenAI } from "@google/genai";
import { improveQuestionQualityService } from "../../../src/services/aiService.js";

const originalApiKey = process.env.GEMINI_API_KEY;

describe("improveQuestionQualityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-api-key";
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalApiKey;
    }
  });

  it("uses one Gemini call with structured output and a 512-token cap", async () => {
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({
        title: "Improved title",
        description: "Improved description",
        tags: ["javascript", "react"],
      }),
    });

    await expect(
      improveQuestionQualityService({
        title: "  Original title ",
        description: " Original details ",
        tags: "javascript, react",
      }),
    ).resolves.toEqual({
      title: "Improved title",
      description: "Improved description",
      tags: "javascript, react",
    });

    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "test-api-key" });
    expect(generateContentMock).toHaveBeenCalledTimes(1);
    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-2.5-flash",
        config: expect.objectContaining({
          responseMimeType: "application/json",
          maxOutputTokens: 512,
        }),
      }),
    );
  });

  it("rejects incomplete input before calling Gemini", async () => {
    await expect(
      improveQuestionQualityService({
        title: " ",
        description: "Some details",
        tags: "",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("reports missing server-side API configuration", async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(
      improveQuestionQualityService({
        title: "A question",
        description: "Some details",
        tags: "",
      }),
    ).rejects.toMatchObject({ statusCode: 500 });

    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("rejects malformed Gemini output", async () => {
    generateContentMock.mockResolvedValue({ text: "not JSON" });

    await expect(
      improveQuestionQualityService({
        title: "A question",
        description: "Some details",
        tags: "",
      }),
    ).rejects.toMatchObject({ statusCode: 502 });
  });
});
