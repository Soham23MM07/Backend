import { Router } from "express";

import {
  registeruser,
  logoutUser,
  loginuser,
  getwatchhistory,
  getuserchannelprofile,
  updateusercoverimage,
  updateuserAvatar,
  updateduserdetails,
  getuserdetails,
  changecurrentpassword,
} from "../controller/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";

import { verifyjwt } from "../middlewares/auth.middleware.js";
const router = Router();

// Both approach are correct

// unsecured route

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
  registeruser
);

router.route("/login").post(loginuser);

//secured routes

router.route("/logout").post(verifyjwt, logoutUser);
router.route("/changepassword").post(verifyjwt, changecurrentpassword);
router.route("/history").get(verifyjwt, getwatchhistory);
router.route("/c/:username").get(verifyjwt, getuserchannelprofile);
router
  .route("/avatar")
  .patch(verifyjwt, upload.single("avatar"), updateuserAvatar);
router
  .route("/coverimage")
  .patch(verifyjwt, upload.single("coverImage"), updateusercoverimage);
router.route("/details").patch(verifyjwt, updateduserdetails);

export default router;
