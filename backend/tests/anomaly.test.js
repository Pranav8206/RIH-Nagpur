import request from 'supertest';
import { app } from '../src/app.js';
import { generateTestToken } from './setup.js';
import Transaction from '../src/models/transaction.model.js';
import Anomaly from '../src/models/anomaly.model.js';

describe('Anomaly Pipeline Vector Processing Limit Extraction Drops', () => {
    let token;

    beforeAll(async () => {
        token = generateTestToken();
    });

    beforeEach(async () => {
        // Seed an abnormal node explicitly
        const trx = await Transaction.create({
            vendor_name: 'Abnormal Flag Node Object Limit Array Ext Vectors',
            category: 'Travel',
            amount: 150000, 
            date: new Date(),
            user_id: 'mockUser123',
            status: 'Pending',
            payment_method: 'Corporate Card'
        });
    });

    it('Should trigger Detection routing analyzing explicitly unmapped transactions checking limits mapping loops recursively', async () => {
        const res = await request(app)
            .post('/api/anomalies/detect')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.detected).toBeGreaterThan(0);
    });

    it('Should cleanly update Node State mapping properly internally checking mapping boundaries explicitly strings limits drop loop hooks bounds natively map limits objects arrays loop vector.', async () => {
        // Execution
        await request(app).post('/api/anomalies/detect').set('Authorization', `Bearer ${token}`).send();
        const anomalyArr = await request(app).get('/api/anomalies').set('Authorization', `Bearer ${token}`);
        
        expect(anomalyArr.body.data.length).toBeGreaterThan(0);
        const anomalyId = anomalyArr.body.data[0]._id;

        const res = await request(app)
            .patch(`/api/anomalies/${anomalyId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'Reviewed' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('Reviewed');
    });
});
