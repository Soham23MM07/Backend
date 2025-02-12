import { Router } from "express";
import { healthcheck } from "../controller/healthcheck.js";

const router = Router();

router.route("/").get(healthcheck);

export default router;
