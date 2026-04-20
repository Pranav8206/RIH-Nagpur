import request from 'supertest';
import { app } from '../src/app.js';
import { generateTestToken } from './setup.js';

describe('Global API Boundary Protections', () => {
    it('Should block access to protected routes without a Token mapped (401)', async () => {
        const res = await request(app).get('/api/transactions');
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('Should block access with a malformed/invalid JWT token (401)', async () => {
        const res = await request(app)
            .get('/api/transactions')
            .set('Authorization', `Bearer junk_token_string`);
            
        expect(res.status).toBe(401);
    });

    it('Should correctly grant access when valid JWT bearer is provided natively', async () => {
        const token = generateTestToken();
        const res = await request(app)
            .get('/api/transactions')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('Should handle completely invalid endpoints securely via 404 limiting map crashes natively.', async () => {
        const res = await request(app).get('/api/non-existent-endpoint');
        expect(res.status).toBe(404);
    });
});
