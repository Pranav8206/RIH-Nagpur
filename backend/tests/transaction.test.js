import request from 'supertest';
import { app } from '../src/app.js';
import { generateTestToken } from './setup.js';
import Transaction from '../src/models/transaction.model.js';

describe('Transaction Workflow Execution Limits', () => {
    let token;

    beforeAll(() => {
        token = generateTestToken();
    });

    it('Should successfully upload a valid transaction block returning 201', async () => {
        const payload = {
            vendor_name: 'Uber Matrix',
            category: 'Travel',
            amount: 450.00,
            date: new Date().toISOString(),
            invoice_number: 'INV-001',
            payment_method: 'Credit Card',
            description: 'Executive transit mapped loop',
            department: 'Sales'
        };

        const res = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.vendor_name).toBe('Uber Matrix');
    });

    it('Should instantly reject malformed payloads yielding 400 Joi validation structures', async () => {
        const invalidPayload = {
            vendor_name: 'Stripe', // Missing explicitly mapped amount + category
        };

        const res = await request(app)
            .post('/api/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send(invalidPayload);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('Should handle listing queries and structural DB lookups robustly natively via arrays limits mapped.', async () => {
        await Transaction.create({ vendor_name: 'Salesforce', category: 'Software', amount: 1500, date: new Date(), user_id: 'mockUser123', payment_method: 'Invoice', status: 'Pending' });
        
        const res = await request(app)
            .get('/api/transactions?vendor_name=Salesforce')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].vendor_name).toBe('Salesforce');
    });
});
