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

const vendors = ["AWS", "GCP", "Azure", "GitHub", "Slack", "Zoom", "Atlassian", "Figma", "Notion", "Salesforce"];
const departments = ["Engineering", "HR", "Marketing", "Sales", "Finance"];
const categories = ["Cloud Services", "Software Logic", "Hardware", "Travel", "Office Supplies"];

const seedDatabase = async () => {
  await connectDB();

  try {
    console.log("Clearing existing data...");
    await User.deleteMany();
    await Transaction.deleteMany();
    await Anomaly.deleteMany();
    await Classification.deleteMany();
    await Recommendation.deleteMany();
    await Prediction.deleteMany();
    await DashboardMetric.deleteMany();
    await AuditLog.deleteMany();

    console.log("Seeding Users...");
    const users = [];
    for (let i = 0; i < 20; i++) {
        users.push({
            email: `user${i}_${Date.now()}@example.com`,
            fullName: `User ${i}`,
            password: "password123"
        });
    }
    const createdUsers = await User.insertMany(users);

    console.log("Seeding Transactions...");
    const transactions = [];
    for (let i = 0; i < 50; i++) {
      transactions.push({
        user_id: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
        vendor_name: vendors[Math.floor(Math.random() * vendors.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        amount: parseFloat((Math.random() * 5000 + 10).toFixed(2)),
        date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
        invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${i}`,
        payment_method: "Credit Card",
        description: "Monthly subscription",
        department: departments[Math.floor(Math.random() * departments.length)],
        status: Math.random() > 0.2 ? "Approved" : "Pending"
      });
    }
    const createdTransactions = await Transaction.insertMany(transactions);

    console.log("Seeding Anomalies...");
    const anomalies = [];
    for (let i = 0; i < 15; i++) {
      anomalies.push({
        user_id: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
        transaction_id: createdTransactions[Math.floor(Math.random() * createdTransactions.length)]._id,
        anomaly_score: parseFloat(Math.random().toFixed(2)),
        detection_type: "Statistical",
        detection_method: "Z-Score",
        severity: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
        reason_description: "Unusually high spend for this vendor",
        detected_at: new Date(),
        status: ["New", "Reviewed", "Resolved"][Math.floor(Math.random() * 3)]
      });
    }
    const createdAnomalies = await Anomaly.insertMany(anomalies);

    console.log("Seeding Classifications...");
    const classifications = [];
    for (let i = 0; i < 10; i++) {
      classifications.push({
        anomaly_id: createdAnomalies[i]._id,
        leakage_type: ["Duplicate", "Fraud", "Idle Subscription", "Vendor Overpayment", "Budget Creep", "Unauthorized"][Math.floor(Math.random() * 6)],
        confidence_score: parseFloat(Math.random().toFixed(2)),
        root_cause: "System Error or Duplicate Invoice",
        key_indicators: { error_code: "DUP_102" },
        recommended_action: "Review and cancel duplicate subscription",
        estimated_recovery: parseFloat((Math.random() * 1000).toFixed(2)),
        impact_level: "High",
        classification_date: new Date(),
        manual_override: false
      });
    }
    const createdClassifications = await Classification.insertMany(classifications);

    console.log("Seeding Recommendations...");
    const recommendations = [];
    for (let i = 0; i < 10; i++) {
      recommendations.push({
        user_id: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
        classification_id: createdClassifications[i]._id,
        recommendation_type: "Action",
        action_template: "Cancellation Email",
        estimated_recovery: createdClassifications[i].estimated_recovery,
        priority: Math.floor(Math.random() * 5) + 1,
        status: ["Pending", "Executed", "Rejected"][Math.floor(Math.random() * 3)],
        action_description: createdClassifications[i].recommended_action
      });
    }
    await Recommendation.insertMany(recommendations);

    console.log("Seeding Predictions...");
    const predictions = [];
    for (let i = 0; i < 5; i++) {
      predictions.push({
        user_id: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
        department: departments[i],
        period: "Q3 2024",
        predicted_leakage: parseFloat((Math.random() * 5000 + 1000).toFixed(2)),
        confidence_interval: "85%",
        baseline_spend: parseFloat((Math.random() * 50000 + 10000).toFixed(2)),
        variance_percent: parseFloat((Math.random() * 15).toFixed(2)),
        forecast_reason: "Historical trend of budget creep",
        alert_threshold: 4000,
        alert_triggered: Math.random() > 0.5
      });
    }
    await Prediction.insertMany(predictions);

    console.log("Seeding Dashboard Metrics...");
    const dashboardMetrics = [];
    for (let i = 0; i < 10; i++) {
      dashboardMetrics.push({
        user_id: createdUsers[0]._id, // usually an admin looking at dashboard
        date_snapshot: new Date(Date.now() - i * 86400000), // last 10 days
        total_transactions: Math.floor(Math.random() * 200 + 50),
        total_spend: parseFloat((Math.random() * 100000 + 20000).toFixed(2)),
        anomalies_detected: Math.floor(Math.random() * 20),
        anomalies_high_risk: Math.floor(Math.random() * 5),
        classified_anomalies: Math.floor(Math.random() * 15),
        recommendations_open: Math.floor(Math.random() * 10),
        total_recovered: parseFloat((Math.random() * 5000).toFixed(2)),
        recovery_rate: parseFloat((Math.random() * 20).toFixed(2)),
        top_leakage_type: "Idle Subscription",
        top_vendor: "AWS",
        top_department: "Engineering"
      });
    }
    await DashboardMetric.insertMany(dashboardMetrics);

    console.log("Seeding Audit Logs...");
    const auditLogs = [];
    for (let i = 0; i < 20; i++) {
      auditLogs.push({
        user_id: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
        action_type: ["View", "Classify", "Recommend", "Execute"][Math.floor(Math.random() * 4)],
        entity_type: "Anomaly",
        entity_id: createdAnomalies[0]._id, // simplified reference
        change_from: "Status: Pending",
        change_to: "Status: Resolved",
        reason: "User action",
        ip_address: "192.168.1.1",
        timestamp: new Date()
      });
    }
    await AuditLog.insertMany(auditLogs);

    console.log("Data seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during data seeding:", error);
    process.exit(1);
  }
};

seedDatabase();
