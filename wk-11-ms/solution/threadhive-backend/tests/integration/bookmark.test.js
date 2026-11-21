import { beforeEach, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
// Import setup to initialize MongoDB
import "../setup.js";
import app from "../../src/app.js";
import Thread from "../../src/models/Thread.js";
import Subreddit from "../../src/models/Subreddit.js";
import Bookmark from "../../src/models/Bookmark.js";
import dotenv from "dotenv";
dotenv.config();

let jwtToken;
let mockUser;

beforeAll(async () => {
  ({ mockUser, jwtToken } = await createUserAndLogin("bookmarkuser"));
});

async function createUserAndLogin(prefix) {
  const email = `${prefix}+${Date.now()}@example.com`;
  const password = "password123";

  const userRes = await request(app)
    .post("/api/auth/register")
    .send({ name: "Bookmark User", email, password, isAdmin: false });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  return {
    mockUser: userRes.body.data,
    jwtToken: loginRes.body.data.token,
  };
}

describe("Bookmark API", () => {
  let thread;
  let subreddit;

  beforeEach(async () => {
    await Bookmark.deleteMany({});
    await Thread.deleteMany({});
    await Subreddit.deleteMany({});

    subreddit = await Subreddit.create({
      name: "Bookmark Test Subreddit",
      description: "Subreddit for bookmark tests",
      author: mockUser._id,
    });

    thread = await Thread.create({
      title: "Bookmark Test Thread",
      content: "Testing bookmarks",
      author: mockUser._id,
      subreddit: subreddit._id,
    });
  });

  // 1. save -> 201, data.thread === thread._id
  it("POST /api/threads/:id/bookmark -> should save thread (201)", async () => {
    const res = await request(app)
      .post(`/api/threads/${thread._id}/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Thread bookmarked successfully");
    expect(res.body.data.thread).toBe(thread._id.toString());
  });

  // 2. list after save -> length 1, populated author + subreddit
  it("GET /api/bookmarks -> should list saved thread populated", async () => {
    await request(app)
      .post(`/api/threads/${thread._id}/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    const res = await request(app)
      .get("/api/bookmarks")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]._id).toBe(thread._id.toString());
    expect(res.body.data[0].author).toHaveProperty("name");
    expect(res.body.data[0].subreddit).toHaveProperty("name");
    expect(res.body.data[0].subreddit).toHaveProperty("description");
  });

  // 3. duplicate save -> 200 "already bookmarked", list still length 1
  it("POST twice -> second is idempotent (200), no duplicate", async () => {
    await request(app)
      .post(`/api/threads/${thread._id}/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    const res = await request(app)
      .post(`/api/threads/${thread._id}/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Thread already bookmarked");

    const listRes = await request(app)
      .get("/api/bookmarks")
      .set("Authorization", `Bearer ${jwtToken}`);
    expect(listRes.body.data).toHaveLength(1);
  });

  // 4. unsave -> 200, list []
  it("DELETE /api/threads/:id/bookmark -> should unsave (200) and clear list", async () => {
    await request(app)
      .post(`/api/threads/${thread._id}/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    const res = await request(app)
      .delete(`/api/threads/${thread._id}/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Bookmark removed successfully");
    expect(res.body.data.threadId).toBe(thread._id.toString());

    const listRes = await request(app)
      .get("/api/bookmarks")
      .set("Authorization", `Bearer ${jwtToken}`);
    expect(listRes.body.data).toEqual([]);
  });

  // 5. unsave again -> 200 (idempotent)
  it("DELETE when not saved -> 200 (idempotent)", async () => {
    const res = await request(app)
      .delete(`/api/threads/${thread._id}/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 6. save non-existent (valid-format) id -> 404 "Thread not found"
  it("POST non-existent thread id -> 404", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const res = await request(app)
      .post(`/api/threads/${fakeId}/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Thread not found");
  });

  // 7. malformed id -> 400 "Invalid thread id"
  it("POST malformed id -> 400", async () => {
    const res = await request(app)
      .post(`/api/threads/not-an-id/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid thread id");
  });

  it("DELETE malformed id -> 400", async () => {
    const res = await request(app)
      .delete(`/api/threads/not-an-id/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid thread id");
  });

  // 8. no token on each endpoint -> 401
  it("all endpoints without a token -> 401", async () => {
    const saveRes = await request(app).post(
      `/api/threads/${thread._id}/bookmark`,
    );
    expect(saveRes.status).toBe(401);

    const unsaveRes = await request(app).delete(
      `/api/threads/${thread._id}/bookmark`,
    );
    expect(unsaveRes.status).toBe(401);

    const listRes = await request(app).get("/api/bookmarks");
    expect(listRes.status).toBe(401);
  });

  // 9. second user's list -> [] (scoping)
  it("GET /api/bookmarks is scoped per user", async () => {
    await request(app)
      .post(`/api/threads/${thread._id}/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    const { jwtToken: otherToken } = await createUserAndLogin("otheruser");

    const res = await request(app)
      .get("/api/bookmarks")
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  // 10. two saves -> newest-saved first (order)
  it("GET /api/bookmarks orders newest-saved first", async () => {
    const thread2 = await Thread.create({
      title: "Second Thread",
      content: "Saved later",
      author: mockUser._id,
      subreddit: subreddit._id,
    });

    await request(app)
      .post(`/api/threads/${thread._id}/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);
    await request(app)
      .post(`/api/threads/${thread2._id}/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    const res = await request(app)
      .get("/api/bookmarks")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]._id).toBe(thread2._id.toString());
    expect(res.body.data[1]._id).toBe(thread._id.toString());
  });

  // 11. delete thread after saving -> list [], no error
  it("omits bookmarks whose thread was deleted", async () => {
    await request(app)
      .post(`/api/threads/${thread._id}/bookmark`)
      .set("Authorization", `Bearer ${jwtToken}`);

    await Thread.findByIdAndDelete(thread._id);

    const res = await request(app)
      .get("/api/bookmarks")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
