import { ApiResponse } from "../utils/Apiresponse.js";
import { ApiError } from "../utils/Apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";

const healthcheck = asyncHandler(async (req, res) => {
  return;
  res.status(200);
  res.json(new ApiResponse(200, "OK", "Health is good"));
});

export { healthcheck };
