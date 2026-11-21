import { TavilySearch } from "@langchain/tavily";

/**
 * Tavily web search tool. Reads TAVILY_API_KEY from the environment.
 * Used by the agent for all travel-related research queries.
 */
export const webSearch = new TavilySearch({
  maxResults: 5,
  description:
    "A web search engine. Use this for travel-related queries: destinations, attractions, hotels, flights, visa requirements, local tips, itineraries, and current travel news.",
});
