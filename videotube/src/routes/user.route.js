import { Router } from "express";
import {
  changepassword,
  getCurrentUser,
  registeruser,
  updateaccountdetails,
  updateAvatarandCoverImage,
} from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { loginuser } from "../controller/user.controller.js";
import { refreshAccessToken } from "../controller/user.controller.js";
import { verifyjwt } from "../middleware/auth.middleware.js";
import { logoutuser } from "../controller/user.controller.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registeruser,
);

router.route("/login").post(loginuser);
router.route("/refresh").get(refreshAccessToken);
router.route("/logout").get(verifyjwt, logoutuser);
router.route("/changepassword").get(verifyjwt, changepassword);
router.route("/currentuser").get(verifyjwt, getCurrentUser);
router.route("/updatefullname").post(verifyjwt, updateaccountdetails);
router.route("/updatedetails").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  verifyjwt,
  updateAvatarandCoverImage,
);

export default router;
