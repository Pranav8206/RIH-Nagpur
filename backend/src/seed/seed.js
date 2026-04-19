import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { Transaction } from "../models/transaction.model.js";
import { Anomaly } from "../models/anomaly.model.js";
import { Classification } from "../models/classification.model.js";
import { Recommendation } from "../models/recommendation.model.js";
import { Prediction } from "../models/prediction.model.js";
import { DashboardMetric } from "../models/dashboardMetric.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import { connectDB } from "../config/db.js";

dotenv.config();

// =======================
// HELPER FUNCTIONS
// =======================
const generateRandomAmount = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const generateInvoiceNumber = (prefix = "INV") => `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 10000)}`;

const approvedVendors = ["AWS", "Microsoft", "Uber", "Dell", "Salesforce"];
const unauthorizedVendors = ["Shady SAAS Ltd.", "Unknown Travels", "Crypto Web Services"];
const departments = ["IT", "Travel", "Operations"];

const pickRandomVendor = (unauthorized = false) => {
  const list = unauthorized ? unauthorizedVendors : approvedVendors;
  return list[Math.floor(Math.random() * list.length)];
};

const pickRandomDate = (monthsBackMin = 1, monthsBackMax = 6) => {
  const date = new Date();
  const pastMonths = Math.floor(Math.random() * (monthsBackMax - monthsBackMin + 1) + monthsBackMin);
  date.setMonth(date.getMonth() - pastMonths);
  date.setDate(Math.floor(Math.random() * 28) + 1); // Random day avoid 31st issues
  return date;
};

const createDuplicateTransaction = (userId, vendor, amount, date) => {
    return [
       {
            user_id: userId,
            vendor_name: vendor,
            amount: amount,
            date: date,
            invoice_number: generateInvoiceNumber("ORIGIN"),
            payment_method: "Bank Transfer",
            description: "Software License Renewal",
            department: "IT",
            status: "Approved"
       },
       {
            user_id: userId,
            vendor_name: vendor,
            amount: amount,
            date: date, // Explicitly the same date
            invoice_number: generateInvoiceNumber("DUP"), // Different invoice identifier
            payment_method: "Bank Transfer",
            description: "Software license payment", // Slight variation in real world
            department: "IT",
            status: "Approved"
       }
    ];
};

// =======================
// SEED EXECUTION
// =======================
const seedDatabase = async () => {
  await connectDB();

  try {
    console.log("Cleaning database...");
    await Transaction.deleteMany({});
    await Anomaly.deleteMany({});
    await Classification.deleteMany({});
    await Recommendation.deleteMany({});
    await Prediction.deleteMany({});
    await DashboardMetric.deleteMany({});
    await AuditLog.deleteMany({});
    
    // Fallback user if missing
    let user = await User.findOne();
    if (!user) {
        user = await User.create({
            email: `admin_${Date.now()}@example.com`,
            fullName: "Admin User",
            password: "password123" 
        });
    }
    const userId = user._id;

    console.log("Generating Transactions...");
    const baseTransactions = [];

    // 1. Generate normal transactions (40)
    for (let i = 0; i < 40; i++) {
        baseTransactions.push({
            user_id: userId,
            vendor_name: pickRandomVendor(),
            amount: generateRandomAmount(500, 50000),
            date: pickRandomDate(),
            invoice_number: generateInvoiceNumber(),
            payment_method: ["Credit Card", "Bank Transfer"][Math.floor(Math.random() * 2)],
            description: "Standard monthly expense",
            department: departments[Math.floor(Math.random() * departments.length)],
            status: "Approved"
        });
    }

    // 2. Duplicate Transactions (10 pairs total, 5 duplicates)
    for (let i = 0; i < 5; i++) {
        const vendor = pickRandomVendor();
        const amount = generateRandomAmount(5000, 20000);
        const date = pickRandomDate();
        baseTransactions.push(...createDuplicateTransaction(userId, vendor, amount, date));
    }

    // 3. Unusually High Transactions (5)
    for (let i = 0; i < 5; i++) {
        baseTransactions.push({
            user_id: userId,
            vendor_name: pickRandomVendor(),
            amount: generateRandomAmount(200000, 500000), // 5-10x normal
            date: pickRandomDate(),
            invoice_number: generateInvoiceNumber("HIGH"),
            payment_method: "Bank Transfer",
            description: "Upfront Annual License Fee",
            department: "Operations",
            status: "Approved"
        });
    }

    // 4. Unauthorized Transactions (3)
    for (let i = 0; i < 3; i++) {
        baseTransactions.push({
            user_id: userId,
            vendor_name: pickRandomVendor(true), // Unauthorized vendors
            amount: generateRandomAmount(2000, 15000),
            date: pickRandomDate(),
            invoice_number: generateInvoiceNumber("SHDY"),
            payment_method: "Credit Card",
            description: "Subscription Service",
            department: "Travel",
            status: "Pending" // Let's leave some pending
        });
    }

    // 5. Unused Subscription (2)
    for (let i = 0; i < 2; i++) {
        baseTransactions.push({
            user_id: userId,
            vendor_name: "Dropbox",
            amount: 1500,
            date: pickRandomDate(),
            invoice_number: generateInvoiceNumber("SUB"),
            payment_method: "Credit Card",
            description: "Monthly Service Fee - Standard",
            department: "IT",
            status: "Approved"
        });
    }

    // Save All Transactions
    const createdTransactions = await Transaction.insertMany(baseTransactions);

    console.log("Generating Anomalies...");
    // Target specific documents using their assigned identifiable logic 
    const anomalousTransactions = await Transaction.find({
        $or: [
            { invoice_number: { $regex: /^DUP/ } },
            { invoice_number: { $regex: /^HIGH/ } },
            { vendor_name: { $in: unauthorizedVendors } },
            { invoice_number: { $regex: /^SUB/ } }
        ]
    });
    
    // Creates approx 15 anomalies based off the injected logic above
    const anomaliesToCreate = anomalousTransactions.slice(0, 15).map((trx) => {
        let detType = "Statistical";
        let sev = "Low";
        let reason = "Detected potential issue";

        if(trx.invoice_number.startsWith("DUP")) { detType = "Duplicate Detection"; sev = "High"; reason = "Exact amount and date match with another transaction for same vendor"; }
        else if(trx.invoice_number.startsWith("HIGH")) { detType = "Budget Creep"; sev = "Medium"; reason = "500% higher than historical average for this vendor"; }
        else if(unauthorizedVendors.includes(trx.vendor_name)) { detType = "Unauthorized"; sev = "High"; reason = "Vendor is not on approved IT procurement list"; }
        else if(trx.invoice_number.startsWith("SUB")) { detType = "Idle Subscription"; sev = "Low"; reason = "Recurring payment with zero recorded active users in past 90 days"; }

        return {
            user_id: userId,
            transaction_id: trx._id,
            anomaly_score: Math.random() * (0.95 - 0.70) + 0.70, // Random scores tilted towards high Risk
            detection_type: detType,
            detection_method: "ML Heuristics",
            severity: sev,
            reason_description: reason,
            detected_at: new Date(),
            status: "New"
        };
    });

    const createdAnomalies = await Anomaly.insertMany(anomaliesToCreate);

    console.log("Generating Classifications...");
    const classificationsToCreate = createdAnomalies.map(anomaly => {
        let leakage = "Budget Creep";
        if(anomaly.detection_type === "Duplicate Detection") leakage = "Duplicate";
        else if(anomaly.detection_type === "Unauthorized") leakage = "Unauthorized";
        else if(anomaly.detection_type === "Idle Subscription") leakage = "Idle Subscription";

        return {
            anomaly_id: anomaly._id,
            leakage_type: leakage,
            confidence_score: 0.88,
            root_cause: "Human Error / Lack of Oversight",
            key_indicators: { flagged_by: "System Rules", timestamp: Date.now() },
            recommended_action: "Review and block vendor",
            estimated_recovery: generateRandomAmount(5000, 20000),
            impact_level: anomaly.severity
        };
    });

    const createdClassifications = await Classification.insertMany(classificationsToCreate);

    console.log("Generating Recommendations...");
    const recommendationsToCreate = createdClassifications.map(classification => {
        return {
            user_id: userId,
            classification_id: classification._id,
            recommendation_type: "Action",
            action_template: "Auto-Cancel Service",
            estimated_recovery: classification.estimated_recovery,
            priority: classification.impact_level === "High" ? 5 : 3,
            status: "Pending",
            action_description: classification.recommended_action
        };
    });

    await Recommendation.insertMany(recommendationsToCreate);

    console.log("Generating Dashboard Metrics...");
    const metricsToCreate = [
        {
            user_id: userId,
            date_snapshot: new Date(), // Current View
            total_transactions: createdTransactions.length,
            total_spend: createdTransactions.reduce((acc, curr) => acc + curr.amount, 0),
            anomalies_detected: createdAnomalies.length,
            anomalies_high_risk: createdAnomalies.filter(a => a.severity === "High").length,
            classified_anomalies: createdClassifications.length,
            recommendations_open: recommendationsToCreate.length,
            total_recovered: 0,
            recovery_rate: 0,
            top_leakage_type: "Duplicate",
            top_vendor: "AWS",
            top_department: "IT"
        },
        {
            user_id: userId,
            date_snapshot: new Date(Date.now() - 86400000 * 7), // 7 days ago snapshot
            total_transactions: 40,
            total_spend: 550000,
            anomalies_detected: 8,
            anomalies_high_risk: 1,
            classified_anomalies: 8,
            recommendations_open: 5,
            total_recovered: 15000,
            recovery_rate: 15, // Percent
            top_leakage_type: "Idle Subscription",
            top_vendor: "Microsoft",
            top_department: "Travel"
        }
    ];

    await DashboardMetric.insertMany(metricsToCreate);

    console.log("=========================================");
    console.log("SEEDED REAL-WORLD FINANCIAL DATA (60 TRX)");
    console.log("=========================================");
    process.exit(0);
  } catch (error) {
    console.error("Error during data seeding:", error);
    process.exit(1);
  }
};

seedDatabase();
