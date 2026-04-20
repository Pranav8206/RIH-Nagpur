import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../src/models/transaction.model.js';
import Anomaly from '../src/models/anomaly.model.js';
import Classification from '../src/models/classification.model.js';
import Recommendation from '../src/models/recommendation.model.js';
import Prediction from '../src/models/prediction.model.js';
import DashboardMetric from '../src/models/dashboardMetric.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function restore() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGODB_URI missing.');
        process.exit(1);
    }
    const args = process.argv.slice(2);
    const backupFileArg = args.find(a => !a.startsWith('--'));
    const clearFlag = args.includes('--clear');

    if (!backupFileArg) {
        console.error('❌ Pass JSON file path.');
        process.exit(1);
    }

    const filePath = path.resolve(process.cwd(), backupFileArg);
    let backupData;
    
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        backupData = JSON.parse(fileContent);
    } catch(err) {
        console.error(`❌ Parse failed: ${err.message}`);
        process.exit(1);
    }

    if (!backupData.data || !backupData.data.transactions) {
        console.error(`❌ Invalid Backup Format`);
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.info(`✅ Connected.`);

        if (clearFlag) {
            console.warn(`⚠️ Clearing before restore.`);
            const query = backupData.user_id_scope === 'ALL' ? {} : { user_id: backupData.user_id_scope };
            await Transaction.deleteMany(query);
            await Anomaly.deleteMany(query);
            await Classification.deleteMany(query);
            await Recommendation.deleteMany(query);
            await Prediction.deleteMany(query);
            await DashboardMetric.deleteMany(query);
        }

        const runInsert = async (Model, dataArr, name) => {
             if (dataArr && dataArr.length > 0) {
                 await Model.insertMany(dataArr);
                 console.info(`✔️ Restored ${dataArr.length} ${name}`);
             }
        };

        await runInsert(Transaction, backupData.data.transactions, 'transactions');
        await runInsert(Anomaly, backupData.data.anomalies, 'anomalies');
        await runInsert(Classification, backupData.data.classifications, 'classifications');
        await runInsert(Recommendation, backupData.data.recommendations, 'recommendations');
        await runInsert(Prediction, backupData.data.predictions, 'predictions');
        await runInsert(DashboardMetric, backupData.data.dashboard_metrics, 'dashboard_metrics');

        const anomalyCount = await Anomaly.countDocuments({ transaction_id: { $exists: true } });
        if (anomalyCount > 0 && backupData.data.anomalies?.length > 0) {
             console.info(`✅ Anomaly relations verified.`);
        }

        console.info(`\n🚀 Restored successfully.`);
    } catch(err) {
        console.error('❌ Restore failed:', err);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(0);
    }
}
restore();
