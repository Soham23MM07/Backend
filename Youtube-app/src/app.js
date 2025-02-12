import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Use CORS middleware to handle cross-origin requests
app.use(cors());

// Common middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import routes
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.route.js";

// Routes
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter); // Assuming userRouter has all user-related routes, including registration

export { app };
