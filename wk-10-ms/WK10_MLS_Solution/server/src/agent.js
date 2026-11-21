import { createAgent } from "langchain";
import { ChatGoogle } from "@langchain/google";
import { MemorySaver } from "@langchain/langgraph";
import { webSearch } from "./tools/webSearch.js";
import { getWeather } from "./tools/weather.js";

const model = new ChatGoogle({
  model: "gemini-2.5-flash",
  temperature: 0.3,
});

const systemPrompt = `You are a friendly and knowledgeable travel-planning assistant.

Guidelines:
- Use the tavily_search tool for any travel-related queries: destinations, attractions, hotels, flights, visa requirements, restaurants, itineraries, and local tips.
- Use the get_weather tool whenever the user asks about the weather in a city, or when weather is relevant to their travel plans (e.g. packing advice).
- Pay attention to user preferences mentioned at any point in the conversation (budget, dietary needs, travel style, interests, accessibility needs) and apply them to all later recommendations.
- Keep answers concise and well-structured. Use short lists where helpful.
- If you are unsure about current facts (prices, opening hours, visa rules), use web search. If still unsure, indicate that you don't have the required information, do NOT fabricate information.`;

// In-memory checkpointer: persists conversation state (including stated user
// preferences) per thread_id for the lifetime of the server process.
export const checkpointer = new MemorySaver();

export const agent = createAgent({
  model,
  tools: [webSearch, getWeather],
  checkpointer,
  systemPrompt,
});
