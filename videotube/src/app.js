import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Use CORS middleware to handle cross-origin requests

app.use(
  cors({
    origin: [process.env.CORS_ORIGIN_1, process.env.CORS_ORIGIN_2],
    credentials: true,
  }),
);

// cookie parser

app.use(cookieParser());

// using express own middlewares

// json data will come inside and it is limited to 16kb
app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// serving static files (images,video)
app.use(express.static("public"));

import healthcheckRouter from "./routes/health.route.js";
import registercheckRouter from "./routes/user.route.js";
import logincheckRouter from "./routes/user.route.js";
import refreshtokenRouter from "./routes/user.route.js";
import logoutcheckRouter from "./routes/user.route.js";
import changepasswordcheckRouter from "./routes/user.route.js";
import currentcheckRouter from "./routes/user.route.js";
import updatecheckRouter from "./routes/user.route.js";
import fullnamecheckRouter from "./routes/user.route.js";
import videcheckRouter from "./routes/video.route.js";
import updatecheckRoutervideo from "./routes/video.route.js";
import getvideobyIdcheckRouter from "./routes/video.route.js";
import deletevideocheckRouter from "./routes/video.route.js";
import deletespecificvideo from "./routes/video.route.js";
import addcommentcheckrouter from "./routes/comments.route.js";
import deletecommentcheckrouter from "./routes/comments.route.js";

// USER ROUTES
app.use("/api/v1/users", registercheckRouter);
app.use("/api/v1/users", logincheckRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", refreshtokenRouter);
app.use("/api/v1/users", logoutcheckRouter);
app.use("/api/v1/users", changepasswordcheckRouter);
app.use("/api/v1/users", currentcheckRouter);
app.use("/api/v1/users", updatecheckRouter);
app.use("/api/v1/users", fullnamecheckRouter);

// VIDEO ROUTES
app.use("/api/v1/users", videcheckRouter);
app.use("/api/v1/users", updatecheckRoutervideo);
app.use("/api/v1/users", getvideobyIdcheckRouter);
app.use("/api/v1/users", deletevideocheckRouter);
app.use("/api/v1/users", deletespecificvideo);

// COMMENT ROUTES
app.use("/api/v1/users", addcommentcheckrouter);
app.use("/api/v1/users", deletecommentcheckrouter);
export { app };
