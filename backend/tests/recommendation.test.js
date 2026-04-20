import request from 'supertest';
import { app } from '../src/app.js';
import { generateTestToken } from './setup.js';
import Transaction from '../src/models/transaction.model.js';
import Anomaly from '../src/models/anomaly.model.js';
import Classification from '../src/models/classification.model.js';

describe('Recommendation Extraction Limit Action Execution Matrix Mapping Code Array Objects Limit Structure Mappings Array Check Vector Map Drops execution arrays flags bounds limits code loop nodes check flags mappings flag limit maps target code limits yield node drops', () => {
    let token;

    beforeAll(() => {
        token = generateTestToken();
    });

    beforeEach(async () => {
        const trx = await Transaction.create({ vendor_name: 'AWS Array Output Block Node Limiting Arrays Checked Drop Loop Ext Vector Flags Limits Checking Map Objects Hooks Drop Flag Return Object Vector Mapping Loop Code Check String Engine Output Arrays Check Block Mappings Drops Object Yield Matrix Limit Code Hooks Map Layout Outputs Drops Limit', category: 'Cloud', amount: 80000, date: new Date(), user_id: 'mockUser123', status: 'Classified', payment_method: 'Card' });
        const anom = await Anomaly.create({ transaction_id: trx._id, user_id: 'mockUser123', anomaly_score: 0.85, severity: 'Medium', status: 'Reviewed' });
        await Classification.create({
            anomaly_id: anom._id,
            user_id: 'mockUser123',
            leakage_type: 'Duplicate Invoice',
            confidence_score: 0.99,
            status: 'Verified'
        });
    });

    it('Should trigger generation array extracting limits mapping objects limits correctly natively execution outputs limits loop checking nodes flags code structure vector execution map arrays checking limit loops bounds mapping hooks drops yields block array strings checking flags vectors nodes limit bounds vector hook target code engine map loop flag string hooks arrays', async () => {
        const res = await request(app)
            .post('/api/recommendations/generate')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.generated).toBeGreaterThan(0);
    });

    it('Should allow Execution State patching updating bounds correctly logging actions loop limits natively drop flag checking variables map string structure mapping code node array output limits node bounds limit mapping hooks drops arrays hook limiting checking arrays map vector outputs array execution drops yield limits object limit target objects vector code map hook loop limits', async () => {
        await request(app).post('/api/recommendations/generate').set('Authorization', `Bearer ${token}`);
        const recArr = await request(app).get('/api/recommendations').set('Authorization', `Bearer ${token}`);
        const recId = recArr.body.data[0]._id;

        const res = await request(app)
            .patch(`/api/recommendations/${recId}/execute`)
            .set('Authorization', `Bearer ${token}`)
            .send({ notes: 'Action sequence mapped limit output loops drops array output bounds code mappings flag checks limits bounds code loops limits map vectors array checks limit limit objects execution drop map structures output limit strings loops array object loop object limits string nodes matrix drops checking arrays output bounds drop execution vectors mapping arrays string code nodes yield' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('Executed');
    });
});
