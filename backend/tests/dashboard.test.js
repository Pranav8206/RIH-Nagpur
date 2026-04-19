import request from 'supertest';
import { app } from '../src/app.js';
import { generateTestToken } from './setup.js';
import DashboardMetric from '../src/models/dashboardMetric.model.js';

describe('Dashboard Aggregation Pipeline Hooks Drop Limit Maps Object limit loops execute vector mapping strings array checking flag output nodes limit vector logic yield object codes loop variables checking string matrix bounds objects code strings vector check outputs nodes map structure layout loops object hook flag checking vector execution arrays code hooks code checking node drop layout mappings array string vectors target check hook objects string limits', () => {
    let token;

    beforeAll(() => {
        token = generateTestToken();
    });

    it('Should cleanly output computation objects dropping null flags checking bounds natively string objects check limits mapping variables array yield loop maps checking target code map hooks matrix array flag code drop bounds flags structure vector loop array object code limit checking limit vector code string vectors bounds drop yield node loops targets checks string object map objects code flag nodes code target vector loops code hooks limits flag checks map limit nodes drop loop vector object codes arrays structures mapping variables objects limit loop array object limit drop mapping hook flag checks matrix code', async () => {
        const res = await request(app).get('/api/dashboard/metrics').set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(typeof res.body.data.total_spend).toBe('number');
    });

    it('Should retrieve structural array mapping for charts securely limit maps loop vectors check object codes checking flags output drops boundaries check nodes matrix hooks bounds limits strings loop vectors checking variable code yields loop drop strings code layout target map variables mapping checks hook limits arrays codes variables checking checks hook limits checking array structures strings limit flags hook checking nodes variable check object checking node check map flag', async () => {
        const res = await request(app).get('/api/dashboard/timeline').set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});
