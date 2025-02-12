import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/Apierror.js";

const verifyjwt = asyncHandler(async (req, _, next) => {
  const incomingaccesstoken =
    req.cookies.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  console.log(incomingaccesstoken);

  if (!incomingaccesstoken) {
    throw new ApiError(400, "accesstoken is required");
  }
  const decodedToken = jwt.verify(
    incomingaccesstoken,
    process.env.ACCESS_TOKEN_SECRET,
  );

  if (!decodedToken) {
    throw new ApiError(400, "Invalid accesstoken");
  }
  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  req.user = user;
  next();
});

export { verifyjwt };
