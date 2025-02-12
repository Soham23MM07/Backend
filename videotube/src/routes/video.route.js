import Router from "express";

const router = Router();

import { publishVideo } from "../controller/video.controller.js";
import { getvideoupdated } from "../controller/video.controller.js";
import { verifyjwt } from "../middleware/auth.middleware.js";
import { getvideobyId } from "../controller/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { deletevideo } from "../controller/video.controller.js";
import { deletespecificvideo } from "../controller/video.controller.js";
router.route("/publishVideo").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
  ]),
  verifyjwt,
  publishVideo,
);

router.route("/UpdateVideo").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
  ]),
  verifyjwt,
  getvideoupdated,
);

router.route("/getvideobyid").get(verifyjwt, getvideobyId);
router.route("/deletevideo").get(verifyjwt, deletevideo);
router.route("/deletevideobyid").get(verifyjwt, deletespecificvideo);

export default router;
