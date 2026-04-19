# Expense Leakage Detection System Backend

## Overview
This backend powers the Expense Leakage Detection System, developed using Node.js, Express, and MongoDB with Mongoose ODM. It includes a comprehensive schema and validation structure, addressing everything from basic transactions to complex anomaly detection, prediction models, and full dashboard metrics.

## Prerequisites
- Node.js (v16.x or higher)
- MongoDB Server (Local or Atlas)

## Setup Instructions

### 1. MongoDB Setup
**Local MongoDB:**
Ensure MongoDB Community Edition is installed and running on default port `27017`.
Connection URI will be `mongodb://localhost:27017/expense_leakage`

**MongoDB Atlas:**
Create a cluster, configure network access (0.0.0.0/0 to allow everywhere for development), and create a database user. Copy the connection string.

### 2. Environment Variables
Create a `.env` file in the root directory and configure it:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense_leakage
# or your Atlas URI:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/expense_leakage?retryWrites=true&w=majority
```

### 3. Install Dependencies
Run the following in the project root:
```bash
npm install
```

### 4. Running the Backend
To start the backend server in development mode:
```bash
npm run dev
```
*(Assuming `npm run dev` or `nodemon` is configured in package.json)*

## Database Seeding
You can populate your database with realistic demonstration data (Users, Transactions, Anomalies, Classifications, Recommendations, etc.).

Run the seeding script:
```bash
node src/seed/seed.js
```

## Data Model Highlights
This project utilizes a highly structured schema with models for:
- `Transaction`: Base spending activities.
- `Anomaly`: Flagged risky transactions.
- `Classification`: Root cause detailing for anomalies.
- `Recommendation`: Targeted recovery actions.
- `Prediction`: ML/Algorithmic forecasting per department.
- `DashboardMetric`: Time-series summaries.
- `AuditLog`: Action tracking for compliance.

### Indexing Strategy
To ensure swift querying across our models, index strategies were implemented specifically matching query patterns:
- **Compound Indexes:** Used heavily, such as `(user_id, date)` on transactions and `(user_id, status)` across anomalies/recommendations to support sorted/paginated views.
- **Unique Indexes:** Assures data integrity, like enforcing uniqueness on `invoice_number`.
- **References:** `transaction_id`, `anomaly_id`, and `user_id` are natively indexed to optimize aggressive query joins and `.populate()` resolution.

### Scaling Strategy
- **Indexing:** Ensures efficient reads and avoids full collection scans for targeted queries.
- **Caching:** In future iterations, implementing an external cache (e.g. Redis) is recommended for read-heavy operations like pulling `DashboardMetric` snapshots.
- **Sharding:** If `Transactions` scaling hits vertical limits, horizontal sharding using `user_id` or `department` as the shard key ensures optimal data distribution.

## Example Aggregation Queries

These pipelines can be implemented via Mongoose to derive meaningful insights on expense leakages.

### 1. Top Leaking Vendors
Aggregates resolved, un-recovered anomaly costs per vendor.
```javascript
const topLeakingVendors = await Transaction.aggregate([
  {
    $lookup: {
      from: "anomalies", // Note: mongoose collections are plural usually
      localField: "_id",
      foreignField: "transaction_id",
      as: "anomaly_data"
    }
  },
  { $unwind: "$anomaly_data" },
  { $match: { "anomaly_data.status": { $ne: "Resolved" } } },
  {
    $group: {
      _id: "$vendor_name",
      total_leakage: { $sum: "$amount" },
      incident_count: { $sum: 1 }
    }
  },
  { $sort: { total_leakage: -1 } },
  { $limit: 10 }
]);
```

### 2. Monthly Leakage Trend
Groups high-risk anomalies by the month they were detected to spot historical trends.
```javascript
const monthlyTrend = await Anomaly.aggregate([
  {
    $lookup: {
      from: "transactions",
      localField: "transaction_id",
      foreignField: "_id",
      as: "transaction"
    }
  },
  { $unwind: "$transaction" },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$detected_at" } },
      total_anomalies: { $sum: 1 },
      total_risk_value: { $sum: "$transaction.amount" }
    }
  },
  { $sort: { _id: 1 } }
]);
```

### 3. High-Risk Anomalies
Finds anomalies flagged as "High" severity, joined with their corresponding transaction details and populated root cause classifications.
```javascript
const highRiskAnomalies = await Anomaly.aggregate([
  { $match: { severity: "High", status: "New" } },
  {
    $lookup: {
      from: "transactions",
      localField: "transaction_id",
      foreignField: "_id",
      as: "transaction_details"
    }
  },
  { $unwind: "$transaction_details" },
  {
    $lookup: {
      from: "classifications",
      localField: "_id",
      foreignField: "anomaly_id",
      as: "classification_details"
    }
  },
  // Classification might be empty if it's new, so preserve blank classifications
  { $unwind: { path: "$classification_details", preserveNullAndEmptyArrays: true } },
  { $sort: { anomaly_score: -1 } },
  { $limit: 20 }
]);
```
