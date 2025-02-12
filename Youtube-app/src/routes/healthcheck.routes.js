import { Router } from "express";

import { healthcheck } from "../controller/healthcheck.js";

const router = Router();

// Both approach are correct

router.route("/").get(healthcheck);

// router.get("/", (res, req) = > {
//     healthcheck

// });

export default router;
