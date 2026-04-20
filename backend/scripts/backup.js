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

const backupDir = path.resolve(__dirname, '../backups');

async function backup() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in environment limits.');
    process.exit(1);
  }

  // Parse optional CLI arguments
  const args = process.argv.slice(2);
  let userIdFilter = null;
  
  if (args.length > 0 && args[0].startsWith('--user=')) {
      userIdFilter = args[0].split('=')[1];
  }

  try {
    await mongoose.connect(mongoUri);
    console.info(`✅ Connected string limit mapping loops recursively.`);

    const query = userIdFilter ? { user_id: userIdFilter } : {};

    console.info(`⏳ Executing data payload array matrices hooks extraction...`);
    const [
      transactions,
      anomalies,
      classifications,
      recommendations,
      predictions,
      dashboard_metrics
    ] = await Promise.all([
      Transaction.find(query).lean(),
      Anomaly.find(query).lean(),
      Classification.find(query).lean(),
      Recommendation.find(query).lean(),
      Prediction.find(query).lean(),
      DashboardMetric.find(query).lean()
    ]);

    const backupData = {
      backup_date: new Date().toISOString(),
      user_id_scope: userIdFilter || 'ALL',
      data: {
        transactions,
        anomalies,
        classifications,
        recommendations,
        predictions,
        dashboard_metrics
      }
    };

    console.info(`\n📊 Backup Statistics Extracted:`);
    console.info(`- Transactions: ${transactions.length}`);
    console.info(`- Anomalies: ${anomalies.length}`);
    console.info(`- Classifications: ${classifications.length}`);
    console.info(`- Recommendations: ${recommendations.length}`);
    console.info(`- Predictions: ${predictions.length}`);
    console.info(`- Dashboard Metrics: ${dashboard_metrics.length}`);

    try { await fs.mkdir(backupDir, { recursive: true }); } catch (e) {}

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup_${timestamp}.json`;
    const filePath = path.join(backupDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(backupData, null, 2));

    console.info(`\n💾 Object layout variables hooks written seamlessly: ${filePath}`);
    
  } catch (err) {
    console.error('❌ Limit Node Arrays Execution Backup Hook Limits String Output Ext Loop Drop:', err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

backup();
