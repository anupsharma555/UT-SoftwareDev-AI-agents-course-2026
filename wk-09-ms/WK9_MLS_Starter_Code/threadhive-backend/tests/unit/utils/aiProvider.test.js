import { beforeEach, describe, it, expect, vi } from "vitest";

const create = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(() => ({ models: { generateContent: create } })),
}));

const load = async () => {
  vi.resetModules();
  return import("../../../src/utils/aiProvider.js");
};

describe("aiProvider.generateText", () => {
  beforeEach(() => {
    create.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns trimmed output text", async () => {
    create.mockResolvedValue({ text: "  hello  " });
    const { generateText } = await load();
    await expect(generateText({ prompt: "p", systemInstruction: "s" })).resolves.toBe("hello");
    expect(create.mock.calls[0][0]).toMatchObject({ model: "gemini-2.5-flash", contents: "p", config: { systemInstruction: "s" } });
  });

  it("throws 502 on empty output", async () => {
    create.mockResolvedValue({ text: "" });
    const { generateText } = await load();
    await expect(generateText({ prompt: "p" })).rejects.toMatchObject({ statusCode: 502 });
  });

  it("maps SDK errors to 502 and rate limits to 429", async () => {
    const { generateText } = await load();
    create.mockRejectedValueOnce(new Error("boom"));
    await expect(generateText({ prompt: "p" })).rejects.toMatchObject({ statusCode: 502 });
    create.mockRejectedValueOnce(Object.assign(new Error("rate"), { status: 429 }));
    await expect(generateText({ prompt: "p" })).rejects.toMatchObject({ statusCode: 429 });
  });
});
