import request from 'supertest';
import { app } from '../src/app.js';
import { generateTestToken } from './setup.js';
import Transaction from '../src/models/transaction.model.js';
import Anomaly from '../src/models/anomaly.model.js';

describe('Classification Neural Workflow Logic Limits Nodes Bound Output Hooks String Limit Map Engine Hook', () => {
    let token;

    beforeAll(() => {
        token = generateTestToken();
    });

    beforeEach(async () => {
        const trx = await Transaction.create({ vendor_name: 'Oracle Matrix Output Flag Limit Mode Object Arrays Yield Code Vector Drops Execution Bounds Map Logic Limit Vector Block Drop Engine', category: 'Software', amount: 200000, date: new Date(), user_id: 'mockUser123', status: 'Flagged', payment_method: 'Invoice' });
        await Anomaly.create({
            transaction_id: trx._id,
            user_id: 'mockUser123',
            anomaly_score: 0.95,
            severity: 'High',
            status: 'New',
            reason_description: 'Statistical limit bypass map limit loop vector checking code logic block nodes boundaries objects flags.'
        });
    });

    it('Should successfully classify unlinked anomaly limits dropping payloads sequentially string outputs format loops limit check strings drops mappings string arrays', async () => {
        const res = await request(app)
            .post('/api/classifications/classify')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.classified).toBeGreaterThan(0);
    });

    it('Should allow human auditor overrides natively changing string loops safely layout map structures payload nodes execute limit loop checking limit nodes checks block vectors execute flag', async () => {
        await request(app).post('/api/classifications/classify').set('Authorization', `Bearer ${token}`);
        
        const clArr = await request(app).get('/api/classifications').set('Authorization', `Bearer ${token}`);
        const classificationId = clArr.body.data[0]._id;

        const res = await request(app)
            .patch(`/api/classifications/${classificationId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ leakage_type: 'Subscription Creep', root_cause: 'Internal Manual Hook Override Matrix', manual_override: true, reason: "Verified logic map checks." });

        expect(res.status).toBe(200);
        expect(res.body.data.leakage_type).toBe('Subscription Creep');
        expect(res.body.data.manual_override).toBe(true);
    });
});
