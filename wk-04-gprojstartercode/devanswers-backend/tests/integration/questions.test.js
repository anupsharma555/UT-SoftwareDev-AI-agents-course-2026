import '../setup.js';
import { beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Question from '../../src/models/Question.js';
import Answer from '../../src/models/Answer.js';
import Tag from '../../src/models/Tag.js';

process.env.JWT_SECRET = 'synthetic-in-memory-test-secret-with-adequate-length';
process.env.NODE_ENV = 'test';

let owner;
let other;
let admin;
let ownerToken;
let otherToken;
let adminToken;

const bearer = (token) => `Bearer ${token}`;
const missingId = () => String(new mongoose.Types.ObjectId());
const createQuestion = (fields = {}) => Question.create({
  title: 'A question',
  description: 'A useful description',
  author: owner._id,
  ...fields,
});

beforeEach(async () => {
  await Answer.deleteMany({});
  await Question.deleteMany({});
  await Tag.deleteMany({});
  await User.deleteMany({});

  [owner, other, admin] = await User.create([
    { name: 'Owner', email: 'owner@example.test', password: 'test-only' },
    { name: 'Other', email: 'other@example.test', password: 'test-only' },
    { name: 'Admin', email: 'admin@example.test', password: 'test-only', isAdmin: true },
  ]);
  const tokenFor = (user) => jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
  ownerToken = tokenFor(owner);
  otherToken = tokenFor(other);
  adminToken = tokenFor(admin);
});

describe('GET /api/questions', () => {
  // An empty question collection returns the public 404 response.
  it('returns 404 when there are no questions', async () => {
    const response = await request(app).get('/api/questions');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, message: 'No questions found' });
  });

  // The list includes safe author data, tags, and answer counts.
  it('returns populated authors, tags, and answer counts', async () => {
    const tag = await Tag.create({ name: 'node' });
    const question = await createQuestion({ tags: [tag._id] });
    await Answer.create({ questionId: question._id, answerText: 'An answer', author: other._id });

    const response = await request(app).get('/api/questions');

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({ answerCount: 1, author: { name: 'Owner' } });
    expect(response.body.data[0].tags[0].name).toBe('node');
    expect(response.body.data[0].author.password).toBeUndefined();
  });

  // Distinct timestamps make descending order observable.
  it('lists newer questions first', async () => {
    const older = await createQuestion({ title: 'Older' });
    const newer = await createQuestion({ title: 'Newer' });
    await Question.collection.updateOne({ _id: older._id }, { $set: { createdAt: new Date('2020-01-01') } });
    await Question.collection.updateOne({ _id: newer._id }, { $set: { createdAt: new Date('2021-01-01') } });

    const response = await request(app).get('/api/questions');
    expect(response.status).toBe(200);
    expect(response.body.data.map(({ title }) => title)).toEqual(['Newer', 'Older']);
  });
});

describe('GET /api/questions/:id', () => {
  // A detail request persists and returns the increased view count.
  it('increments and returns the current view count', async () => {
    const question = await createQuestion();
    const response = await request(app).get(`/api/questions/${question._id}`);
    expect(response.status).toBe(200);
    expect(response.body.data.views).toBe(1);
    expect((await Question.findById(question._id)).views).toBe(1);
  });

  // Detail populates the question and its related answers.
  it('includes the question author, tags, and answers with author names', async () => {
    const tag = await Tag.create({ name: 'node' });
    const question = await createQuestion({ tags: [tag._id] });
    await Answer.create({ questionId: question._id, answerText: 'Response', author: other._id });
    const response = await request(app).get(`/api/questions/${question._id}`);
    expect(response.status).toBe(200);
    expect(response.body.data.author.name).toBe('Owner');
    expect(response.body.data.tags[0].name).toBe('node');
    expect(response.body.data.answers).toHaveLength(1);
    expect(response.body.data.answers[0]).toMatchObject({ answerText: 'Response', author: { name: 'Other' } });
  });

  // An unknown ID returns 404 without a question payload.
  it('returns 404 for an unknown question', async () => {
    const response = await request(app).get(`/api/questions/${missingId()}`);
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

describe('POST /api/questions', () => {
  // Unauthenticated callers cannot create questions.
  it('requires authentication', async () => {
    const response = await request(app).post('/api/questions').send({ title: 'New', description: 'Body', tags: 'node' });
    expect(response.status).toBe(401);
    expect(await Question.countDocuments()).toBe(0);
  });

  // The token supplies the author and tag names become references.
  it('creates a question for the authenticated user and resolves tags', async () => {
    const response = await request(app).post('/api/questions').set('Authorization', bearer(ownerToken))
      .send({ title: 'New', description: 'Body', tags: 'node, mongo', author: String(other._id) });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ success: true, message: 'Question created successfully' });
    expect(response.body.data.author).toBe(String(owner._id));
    expect((await Question.findById(response.body.data._id)).tags).toHaveLength(2);
    expect(await Tag.countDocuments()).toBe(2);
  });

  // Invalid tags fail before a question is stored.
  it('rejects a non-string tag input without saving a question', async () => {
    const response = await request(app).post('/api/questions').set('Authorization', bearer(ownerToken))
      .send({ title: 'New', description: 'Body', tags: ['node'] });
    expect(response.status).toBe(400);
    expect(await Question.countDocuments()).toBe(0);
  });
});

describe('PUT /api/questions/:id', () => {
  // Unauthenticated callers cannot edit questions.
  it('requires authentication', async () => {
    const question = await createQuestion();
    const response = await request(app).put(`/api/questions/${question._id}`).send({ title: 'Denied' });
    expect(response.status).toBe(401);
  });

  // A non-owner cannot change saved question data.
  it('rejects a non-owner without changing the question', async () => {
    const question = await createQuestion();
    const response = await request(app).put(`/api/questions/${question._id}`)
      .set('Authorization', bearer(otherToken)).send({ title: 'Denied' });
    expect(response.status, response.body.message).toBe(403);
    expect((await Question.findById(question._id)).title).toBe('A question');
  });

  // An authenticated update of a missing record returns 404.
  it('returns 404 when an authenticated user updates a missing question', async () => {
    const response = await request(app).put(`/api/questions/${missingId()}`)
      .set('Authorization', bearer(ownerToken)).send({ title: 'Unavailable' });
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  // The owner can update content and tag references.
  it('lets the owner update title and tags', async () => {
    const question = await createQuestion();
    const response = await request(app).put(`/api/questions/${question._id}`)
      .set('Authorization', bearer(ownerToken)).send({ title: 'Revised', tags: 'node' });
    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe('Revised');
    expect((await Question.findById(question._id)).tags).toHaveLength(1);
  });

  // An admin can edit a question owned by another user.
  it('lets an admin update someone else’s question', async () => {
    const question = await createQuestion();
    const response = await request(app).put(`/api/questions/${question._id}`)
      .set('Authorization', bearer(adminToken)).send({ description: 'Admin revision' });
    expect(response.status).toBe(200);
    expect(response.body.data.description).toBe('Admin revision');
  });
});

describe('DELETE /api/questions/:id', () => {
  // Unauthenticated callers cannot remove questions.
  it('requires authentication', async () => {
    const question = await createQuestion();
    const response = await request(app).delete(`/api/questions/${question._id}`);
    expect(response.status).toBe(401);
    expect(await Question.findById(question._id)).not.toBeNull();
  });

  // A denied delete leaves the question in place.
  it('rejects a non-owner without deleting records', async () => {
    const question = await createQuestion();
    const response = await request(app).delete(`/api/questions/${question._id}`)
      .set('Authorization', bearer(otherToken));
    expect(response.status).toBe(403);
    expect(await Question.findById(question._id)).not.toBeNull();
  });

  // Deleting a missing question reports 404.
  it('returns 404 when an authenticated user deletes a missing question', async () => {
    const response = await request(app).delete(`/api/questions/${missingId()}`)
      .set('Authorization', bearer(ownerToken));
    expect(response.status).toBe(404);
  });

  // Owner deletion removes both question and related answers.
  it('deletes the owner question and all its answers', async () => {
    const question = await createQuestion();
    await Answer.create({ questionId: question._id, answerText: 'Response', author: other._id });
    const response = await request(app).delete(`/api/questions/${question._id}`)
      .set('Authorization', bearer(ownerToken));
    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(String(question._id));
    expect(await Question.findById(question._id)).toBeNull();
    expect(await Answer.countDocuments({ questionId: question._id })).toBe(0);
  });

  // An admin can delete a question owned by another user.
  it('lets an admin delete someone else’s question', async () => {
    const question = await createQuestion();
    const response = await request(app).delete(`/api/questions/${question._id}`)
      .set('Authorization', bearer(adminToken));
    expect(response.status).toBe(200);
    expect(await Question.findById(question._id)).toBeNull();
  });
});

describe('POST /api/questions/:id/upvote', () => {
  // Voting requires an authenticated user.
  it('requires authentication', async () => {
    const question = await createQuestion();
    const response = await request(app).post(`/api/questions/${question._id}/upvote`);
    expect(response.status).toBe(401);
  });

  // An upvote changes the saved count and response summary.
  it('records one upvote and returns the vote summary', async () => {
    const question = await createQuestion();
    const response = await request(app).post(`/api/questions/${question._id}/upvote`)
      .set('Authorization', bearer(otherToken));
    expect(response.status).toBe(200);
    expect(response.body.data.voteCount).toBe(1);
    expect(response.body.data).toHaveProperty('upvotes');
    expect((await Question.findById(question._id)).upvotes).toHaveLength(1);
  });

  // Switching direction removes the earlier downvote.
  it('switches a user’s downvote to an upvote', async () => {
    const question = await createQuestion();
    await request(app).post(`/api/questions/${question._id}/downvote`).set('Authorization', bearer(otherToken));
    const response = await request(app).post(`/api/questions/${question._id}/upvote`)
      .set('Authorization', bearer(otherToken));
    expect(response.status).toBe(200);
    expect(response.body.data.voteCount).toBe(1);
    const saved = await Question.findById(question._id);
    expect(saved.upvotes).toHaveLength(1);
    expect(saved.downvotes).toHaveLength(0);
  });

  // Repeating an upvote must not count twice.
  it('does not add a second vote from the same user', async () => {
    const question = await createQuestion();
    await request(app).post(`/api/questions/${question._id}/upvote`).set('Authorization', bearer(otherToken));
    const response = await request(app).post(`/api/questions/${question._id}/upvote`)
      .set('Authorization', bearer(otherToken));
    expect(response.status).toBe(200);
    expect(response.body.data.voteCount).toBe(1);
    expect((await Question.findById(question._id)).upvotes).toHaveLength(1);
  });
});

describe('POST /api/questions/:id/downvote', () => {
  // Downvoting also requires authentication.
  it('requires authentication', async () => {
    const question = await createQuestion();
    const response = await request(app).post(`/api/questions/${question._id}/downvote`);
    expect(response.status).toBe(401);
  });

  // A first downvote produces a negative count.
  it('records a downvote on an unvoted question', async () => {
    const question = await createQuestion();
    const response = await request(app).post(`/api/questions/${question._id}/downvote`)
      .set('Authorization', bearer(otherToken));
    expect(response.status).toBe(200);
    expect(response.body.data.voteCount).toBe(-1);
    expect((await Question.findById(question._id)).downvotes).toHaveLength(1);
  });

  // Repeating a downvote must not count twice.
  it('does not add a duplicate downvote from the same user', async () => {
    const question = await createQuestion();
    await request(app).post(`/api/questions/${question._id}/downvote`).set('Authorization', bearer(otherToken));
    const response = await request(app).post(`/api/questions/${question._id}/downvote`)
      .set('Authorization', bearer(otherToken));
    expect(response.status).toBe(200);
    expect(response.body.data.voteCount).toBe(-1);
    expect((await Question.findById(question._id)).downvotes).toHaveLength(1);
  });

  // Switching direction removes the earlier upvote.
  it('switches the user’s upvote to a downvote', async () => {
    const question = await createQuestion();
    await request(app).post(`/api/questions/${question._id}/upvote`).set('Authorization', bearer(otherToken));
    const response = await request(app).post(`/api/questions/${question._id}/downvote`)
      .set('Authorization', bearer(otherToken));
    expect(response.status).toBe(200);
    expect(response.body.data.voteCount).toBe(-1);
    const saved = await Question.findById(question._id);
    expect(saved.upvotes).toHaveLength(0);
    expect(saved.downvotes).toHaveLength(1);
  });
});

describe('GET /api/questions/:questionId/answers', () => {
  // The nested list reports 404 when no answers exist.
  it('returns 404 when the question has no answers', async () => {
    const question = await createQuestion();
    const response = await request(app).get(`/api/questions/${question._id}/answers`);
    expect(response.status).toBe(404);
  });

  // Public answer reads include the author name.
  it('returns answers with author names without authentication', async () => {
    const question = await createQuestion();
    await Answer.create({ questionId: question._id, answerText: 'Response', author: other._id });
    const response = await request(app).get(`/api/questions/${question._id}/answers`);
    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({ answerText: 'Response', author: { name: 'Other' } });
  });

  // The nested list excludes answers to other questions.
  it('does not include answers to another question', async () => {
    const question = await createQuestion();
    const elsewhere = await createQuestion({ title: 'Elsewhere' });
    await Answer.create({ questionId: question._id, answerText: 'Here', author: owner._id });
    await Answer.create({ questionId: elsewhere._id, answerText: 'There', author: other._id });
    const response = await request(app).get(`/api/questions/${question._id}/answers`);
    expect(response.status).toBe(200);
    expect(response.body.data.map(({ answerText }) => answerText)).toEqual(['Here']);
  });
});

describe('POST /api/questions/:questionId/answers', () => {
  // Creating an answer requires authentication.
  it('requires authentication', async () => {
    const question = await createQuestion();
    const response = await request(app).post(`/api/questions/${question._id}/answers`)
      .send({ answerText: 'Denied' });
    expect(response.status).toBe(401);
    expect(await Answer.countDocuments()).toBe(0);
  });

  // A malformed token cannot create an answer.
  it('rejects a token with an invalid signature', async () => {
    const question = await createQuestion();
    const response = await request(app).post(`/api/questions/${question._id}/answers`)
      .set('Authorization', bearer('invalid-token')).send({ answerText: 'Denied' });
    expect(response.status).toBe(401);
    expect(await Answer.countDocuments()).toBe(0);
  });

  // The token, not a body-supplied ID, determines the author.
  it('creates a populated answer owned by the authenticated user', async () => {
    const question = await createQuestion();
    const response = await request(app).post(`/api/questions/${question._id}/answers`)
      .set('Authorization', bearer(ownerToken))
      .send({ answerText: 'Response', author: String(other._id) });
    expect(response.status).toBe(201);
    expect(response.body.data.answerText).toBe('Response');
    expect(response.body.data.author.name).toBe('Owner');
    expect((await Answer.findById(response.body.data._id)).author.equals(owner._id)).toBe(true);
  });
});
