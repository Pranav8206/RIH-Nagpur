import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.static("public")); // Serve static files Example: /public/image.png (accessible via URL)
app.use(express.json({ limit: "16kb" })); // Parse incoming JSON requests. limit: prevents large payload attacks
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Parse URL-encoded data (form submissions)
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Welcome");
});

// routes import
import userRouter from "./routes/user.route.js";
import importRouter from "./routes/importRoutes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/import", importRouter);

app.use((req, res, next) => {
  console.log("app.js 1");

  const err = new Error("Route not found");
  err.statusCode = 404;
  next(err);
});

app.use((err, req, res, next) => {
  console.log("app.js 2");

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export { app };
