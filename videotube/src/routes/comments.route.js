import Router from "express";
import { verifyjwt } from "../middleware/auth.middleware.js";
import { addcomment, deletecomment } from "../controller/comment.controller.js";

const router = Router();

router.route("/addcomment").post(verifyjwt, addcomment);
router.route("/deletecomment").get(verifyjwt, deletecomment);

export default router;
