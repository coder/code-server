import { app } from '../../src/node/routes/index';
import request from 'supertest';

describe('Protected endpoints reject unauthenticated requests', () => {
  const endpoints = [
    '/proxy/8080',
    '/absproxy/3000'
  ];

  const payloads = [
    { description: 'missing authorization header', headers: {} },
    { description: 'malformed token', headers: { Authorization: 'Bearer invalid.token.here' } },
    { description: 'expired token', headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MzMwNzYwMDB9.invalid-signature' } },
    { description: 'valid token', headers: { Authorization: 'Bearer valid.test.token' } }
  ];

  test.each(endpoints)('endpoint %s rejects unauthenticated requests', async (endpoint) => {
    test.each(payloads)('with $description', async ({ headers }) => {
      const response = await request(app)
        .get(endpoint)
        .set(headers);
      
      // Should reject with 401 or 403 for all but valid token case
      if (headers.Authorization === 'Bearer valid.test.token') {
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      } else {
        expect([401, 403]).toContain(response.status);
      }
    });
  });
});