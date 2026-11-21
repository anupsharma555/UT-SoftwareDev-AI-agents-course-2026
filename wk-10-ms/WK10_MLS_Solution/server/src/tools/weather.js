import { tool } from "langchain";
import { z } from "zod";

/**
 * Weather lookup tool backed by the free wttr.in JSON API (no API key required).
 * Returns current conditions plus a 3-day forecast for a given city.
 */
export const getWeather = tool(
  async ({ city }) => {
    try {
      const res = await fetch(
        `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
        { headers: { "User-Agent": "travel-agent" } }
      );
      if (!res.ok) {
        return `Could not fetch weather for "${city}" (HTTP ${res.status}). Please check the city name.`;
      }
      const data = await res.json();

      const current = data.current_condition?.[0];
      if (!current) {
        return `No weather data available for "${city}".`;
      }

      const area = data.nearest_area?.[0];
      const location = area
        ? `${area.areaName?.[0]?.value}, ${area.country?.[0]?.value}`
        : city;

      const lines = [
        `Weather for ${location}:`,
        `Current: ${current.weatherDesc?.[0]?.value}, ${current.temp_C}°C (feels like ${current.FeelsLikeC}°C), ` +
          `humidity ${current.humidity}%, wind ${current.windspeedKmph} km/h`,
        `3-day forecast:`,
      ];

      for (const day of data.weather ?? []) {
        const desc = day.hourly?.[4]?.weatherDesc?.[0]?.value ?? "";
        lines.push(
          `  ${day.date}: ${desc} — high ${day.maxtempC}°C / low ${day.mintempC}°C` +
            (day.hourly?.[4]?.chanceofrain
              ? `, ${day.hourly[4].chanceofrain}% chance of rain`
              : "")
        );
      }

      return lines.join("\n");
    } catch (err) {
      return `Error fetching weather for "${city}": ${err.message}`;
    }
  },
  {
    name: "get_weather",
    description:
      "Get the current weather and 3-day forecast for a given city. Use this whenever the user asks about weather conditions in a location.",
    schema: z.object({
      city: z.string().describe("The city name, e.g. 'Paris' or 'New Delhi'"),
    }),
  }
);
