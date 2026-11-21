import { beforeEach, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
// Import setup to initialize MongoDB
import '../setup.js';
import app from "../../src/app.js";
import Thread from "../../src/models/Thread.js";
import Subreddit from "../../src/models/Subreddit.js";
import dotenv from "dotenv";
dotenv.config();

let jwtToken;
let mockUser;

beforeAll(async () => {
  ({ mockUser, jwtToken } = await createUserAndLogin());
});

async function createUserAndLogin() {
  const email = `searchuser+${Date.now()}@example.com`;
  const password = "password123";

  const userRes = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Search User",
      email,
      password,
      isAdmin: false,
    });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  return {
    mockUser: userRes.body.data,
    jwtToken: loginRes.body.data.token,
  };
}

describe("Search API", () => {
  let subreddit;

  // Reset database and seed a known set of threads before each test
  beforeEach(async () => {
    await Thread.deleteMany({});
    await Subreddit.deleteMany({});

    subreddit = await Subreddit.create({
      name: "test-subreddit-search",
      description: "Subreddit for search tests",
      author: mockUser._id,
    });

    await Thread.create([
      {
        title: "Bookmarks guide",
        content: "How to save your favorite threads.",
        author: mockUser._id,
        subreddit: subreddit._id,
      },
      {
        title: "JavaScript tips",
        content: "Some useful coding advice for everyone.",
        author: mockUser._id,
        subreddit: subreddit._id,
      },
      {
        // keyword "asynchronous" only appears in the body, not the title
        title: "Random discussion",
        content: "Let us talk about asynchronous programming patterns.",
        author: mockUser._id,
        subreddit: subreddit._id,
      },
      {
        title: "c++ pointers",
        content: "Understanding memory management in C.",
        author: mockUser._id,
        subreddit: subreddit._id,
      },
    ]);
  });

  const search = (q) => {
    const req = request(app).get("/api/search/threads");
    return q === undefined
      ? req.set("Authorization", `Bearer ${jwtToken}`)
      : req.query({ q }).set("Authorization", `Bearer ${jwtToken}`);
  };

  // 1. Title-word match
  it("returns threads whose title contains the query word", async () => {
    const res = await search("Bookmarks");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const titles = res.body.data.map((t) => t.title);
    expect(titles).toContain("Bookmarks guide");
  });

  // 2. Content-only-word match
  it("returns threads whose content (not title) contains the query word", async () => {
    const res = await search("asynchronous");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("Random discussion");
  });

  // 3. Case-insensitive
  it("matches case-insensitively (BOOKMARKS == bookmarks)", async () => {
    const upper = await search("BOOKMARKS");
    const lower = await search("bookmarks");

    expect(upper.status).toBe(200);
    expect(lower.status).toBe(200);
    const upperTitles = upper.body.data.map((t) => t.title).sort();
    const lowerTitles = lower.body.data.map((t) => t.title).sort();
    expect(upperTitles).toEqual(lowerTitles);
    expect(upperTitles).toContain("Bookmarks guide");
  });

  // 4. Substring / partial
  it("matches partial substrings (ook -> Bookmarks guide)", async () => {
    const res = await search("ook");

    expect(res.status).toBe(200);
    const titles = res.body.data.map((t) => t.title);
    expect(titles).toContain("Bookmarks guide");
  });

  // 5. Regex-safe
  it("treats regex metacharacters literally (c++ -> 'c++ pointers', no error)", async () => {
    const res = await search("c++");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("c++ pointers");
  });

  // 6. No matches
  it("returns 200 with an empty array when nothing matches", async () => {
    const res = await search("zzzznomatch");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  // 7. Blank and missing query
  it("returns 200 with an empty array for a blank query", async () => {
    const res = await search("");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("returns 200 with an empty array when the q param is missing", async () => {
    const res = await search(undefined);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("returns 200 with an empty array for a whitespace-only query", async () => {
    const res = await search("   ");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  // 8. Auth required
  it("returns 401 without a valid Bearer token", async () => {
    const res = await request(app).get("/api/search/threads").query({ q: "Bookmarks" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 9. Populated results
  it("populates author (name) and subreddit (name) on each result", async () => {
    const res = await search("Bookmarks");

    expect(res.status).toBe(200);
    const thread = res.body.data[0];
    expect(thread.author).toMatchObject({ name: "Search User" });
    expect(thread.subreddit).toMatchObject({ name: "test-subreddit-search" });
  });

  // 10. Ordering (newest first)
  it("returns results newest-first by createdAt", async () => {
    await Thread.deleteMany({});

    const older = await Thread.create({
      title: "ordering older match",
      content: "first",
      author: mockUser._id,
      subreddit: subreddit._id,
    });
    const newer = await Thread.create({
      title: "ordering newer match",
      content: "second",
      author: mockUser._id,
      subreddit: subreddit._id,
    });

    // Set deterministic timestamps without triggering auto-timestamps.
    await Thread.updateOne(
      { _id: older._id },
      { $set: { createdAt: new Date("2024-01-01T00:00:00.000Z") } },
      { timestamps: false },
    );
    await Thread.updateOne(
      { _id: newer._id },
      { $set: { createdAt: new Date("2024-06-01T00:00:00.000Z") } },
      { timestamps: false },
    );

    const res = await search("ordering");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].title).toBe("ordering newer match");
    expect(res.body.data[1].title).toBe("ordering older match");
  });

  // 11. Result cap at 50
  it("returns at most 50 threads for a single query", async () => {
    await Thread.deleteMany({});

    const docs = Array.from({ length: 60 }, (_, i) => ({
      title: `capped thread ${i}`,
      content: "cappedkeyword body",
      author: mockUser._id,
      subreddit: subreddit._id,
    }));
    await Thread.create(docs);

    const res = await search("cappedkeyword");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(50);
  });
});
