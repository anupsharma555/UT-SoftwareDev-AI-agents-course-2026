import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 90_000, // live LLM turns are slow
    fileParallelism: false,
  },
});
