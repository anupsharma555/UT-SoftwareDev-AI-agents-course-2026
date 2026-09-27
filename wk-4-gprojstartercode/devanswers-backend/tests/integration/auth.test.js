import '../setup.js';
import { beforeEach, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';

process.env.JWT_SECRET = 'synthetic-in-memory-auth-test-secret';
process.env.JWT_EXPIRATION = '7d';
process.env.NODE_ENV = 'test';

beforeEach(async () => {
  await User.deleteMany({});
});

it('ignores a client-supplied admin flag during public registration', async () => {
  const credentials = {
    name: 'Test Member',
    email: 'member@example.test',
    password: 'synthetic-test-password',
  };

  // Verify the response, saved user, and issued token all remain non-admin.
  const registration = await request(app).post('/api/auth/register')
    .send({ ...credentials, isAdmin: true });
  expect(registration.status).toBe(201);
  expect(registration.body.data.isAdmin).toBe(false);
  expect(registration.body.data.password).toBeUndefined();

  const saved = await User.findOne({ email: credentials.email });
  expect(saved.isAdmin).toBe(false);

  const login = await request(app).post('/api/auth/login')
    .send({ email: credentials.email, password: credentials.password });
  expect(login.status).toBe(200);
  expect(jwt.verify(login.body.data.token, process.env.JWT_SECRET).isAdmin).toBe(false);
});
