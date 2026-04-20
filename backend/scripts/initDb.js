import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Transaction from '../src/models/transaction.model.js';
import Anomaly from '../src/models/anomaly.model.js';
import Classification from '../src/models/classification.model.js';
import Recommendation from '../src/models/recommendation.model.js';
import DashboardMetric from '../src/models/dashboardMetric.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function initDb() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ Missing MONGODB_URI.');
        process.exit(1);
    }

    try {
        console.info(`⏳ Connecting to MongoDB...`);
        await mongoose.connect(mongoUri);

        console.info(`\n🛠 Building Collections & Indexes...`);
        await Promise.all([
             Transaction.init(),
             Anomaly.init(),
             Classification.init(),
             Recommendation.init(),
             DashboardMetric.init()
        ]);
        console.info(`✅ Collections and Indexes built successfully!`);

        const count = await Transaction.countDocuments();
        if (count === 0) {
            console.info('\n🌱 DB is empty. Seeding initial baseline transaction...');
            await Transaction.create({ 
               vendor_name: "Initialization Target", 
               category: 'System', 
               amount: 0, 
               date: new Date(), 
               user_id: 'system_root',
               status: 'Pending',
               payment_method: 'N/A'
            });
            console.info('✅ Seeded baseline array nodes seamlessly.');
        } else {
             console.info(`\n📊 DB already initialized (${count} limit nodes exist). Map checks bounds yield vectors matrix Object output flag arrays array Map vector.`);
        }

        console.info(`\n🚀 Database initialized successfully!`);
    } catch(err) {
        console.error('❌ Init Error Vectors Output Strings:', err);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(0);
    }
}

initDb();
