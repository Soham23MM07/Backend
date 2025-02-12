import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model .js";
import {
  uploadtocloudinary,
  deletefromcloudniary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { getRounds } from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const uploadImageToCloudinary = async (filePath) => {
  try {
    return await uploadtocloudinary(filePath);
  } catch (error) {
    console.log(`Error Uploading Image: ${error.message}`);
    throw new ApiError(500, "Image upload failed");
  }
};

const registeruser = asyncHandler(async (req, res) => {
  const { fullname, email, password, username } = req.body;

  if (
    [fullname, email, password, username].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "Fields are empty");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User already exists with the same username or email"
    );
  }

  console.log("Files received:", req.files);
  console.log("Body received:", req.body);

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  console.log(avatarLocalPath);
  console.log(coverLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Empty Avatar");
  }

  let avatar, coverImage;

  try {
    avatar = await uploadImageToCloudinary(avatarLocalPath);
    console.log("Uploaded avatar", avatar);
  } catch (error) {
    console.log("Error uploading avatar:", error.message);
    throw new ApiError(500, "Avatar upload failed");
  }

  if (coverLocalPath) {
    try {
      coverImage = await uploadImageToCloudinary(coverLocalPath);
      console.log("Uploaded cover image", coverImage);
    } catch (error) {
      console.log("Error uploading cover image:", error.message);
      await deletefromcloudniary(avatar.public_id);
      throw new ApiError(500, "Cover image upload failed");
    }
  }

  console.log(User);

  // .create is basically creating our user into mongoDB using mongoose as ORM

  try {
    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });

    console.log(user);

    // user._id is a  MONGODB object id  of newly created user
    // .select is basically "-password" i don't want this think in my new variable

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(400, "User not found after creation");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    console.log("User creation failed:", error.message);
    if (avatar) {
      await deletefromcloudniary(avatar.public_id);
    }
    if (coverImage) {
      await deletefromcloudniary(coverImage.public_id);
    }
    throw new ApiError(500, "User creation failed, images were deleted");
  }
});

const generateTokenandrefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(400, "User is not there");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error(error);

    throw new ApiError(404, "User not found fshfosjd");
  }
};

const loginuser = asyncHandler(async (req, res) => {
  console.log("Login attempt with:", {
    email: req.body.email,
    password: req.body.password,
  });
  //get data from the body

  const { email, password, username } = req.body;

  //validation

  if (!email) {
    throw new ApiError(400, "Email not Found");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  console.log(user);

  if (!user) {
    throw new ApiError(500, "User not found jfdf");
  }

  //validate password

  const ispasswordvalid = await user.isPasswordCorrect(password);

  console.log(ispasswordvalid);

  if (!ispasswordvalid) {
    throw new ApiError(500, "Password is invalid");
  }

  console.log(user._id);

  const { accessToken, refreshToken } = await generateTokenandrefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(400, "Not found");
  }

  const options = {
    httpOnly: true, // server can only  accepts this cookie  not javascipt running in brower
    secure: process.env.NODE_ENV === "production", // secure
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "USER LOGGED SUCCESSFULLY"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );

  const options = {};

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshaccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(400, "Invalid refresh token");
    }

    if (incomingRefreshToken == !user?.refreshToken) {
      throw new ApiError(400, "inavlid refresh token");
    }

    // this options is used to share our refresh token and access token among server database and client securely

    const options = {
      httpOnly: true, // server can only  accepts this cookie  not javascipt running in brower
      secure: process.env.NODE_ENV === "production", // secure
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateTokenandrefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError();
  }
});

const changecurrentpassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;

  const user = await User.findById(req.user._id);

  const isPasswordCorrect = user.isPasswordCorrect(oldpassword);

  if (isPasswordCorrect) {
    throw new ApiError(400, "Old password is correct");
  }

  user.password = newpassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Successfully Password Changed"));
});

const getuserdetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  return res.status(200).json(new ApiResponse(200, user, "User Details "));
});

const updateduserdetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(404, "FullName and Email Not Found");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password", "-refreshToken");

  return res.status(200).json(new ApiResponse(200, user, "All Info Updated"));
});

const updateuserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(404, "Files Not Found");
  }

  const avatar = await uploadImageToCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(404, "Something Went Wrong With URL");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password", "-refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

const updateusercoverimage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;

  if (!coverLocalPath) {
    throw new ApiError(404, "Cover Image Not Found");
  }

  const coverimage = await uploadImageToCloudinary(coverLocalPath);

  if (coverimage.url) {
    throw new ApiError(404, "Cover image URL not found");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverimage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password", "-refreshToken");

  return res
    .status(400)
    .json(new ApiResponse(200, user, "CoverImage Is Updated Successfully"));
});

const getuserchannelprofile = asyncHandler(async (req, res) => {
  const username = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username not found");
  }

  const channel = await username.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "susbscription",
        localfield: "_id",
        forigenfield: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "susbscription",
        localfield: "_id",
        forigenfield: "subscriber",
        as: "subscribedto",
      },
    },
    {
      $addFields: {
        channelcount: { $size: "$subscribers" },
        subscriberscount: { $size: "$subscribedto" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subcribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscriberscount: 1,
        subscribedto: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(400, "Channel not found");
  }
  console.log(channel);

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel Fetched Successfully"));
});

const getwatchhistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "video",
        localField: "WatchHistory",
        forigenField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "user",
              localField: "owner",
              forigenField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  console.log(user);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.watchHistory,
        "Watch History Fetched Successfully"
      )
    );
});

export { registeruser };
export { loginuser };
export { refreshaccessToken };
export { logoutUser };
export { changecurrentpassword };
export { getuserdetails };
export { updateduserdetails };
export { updateuserAvatar };
export { updateusercoverimage };
export { getuserchannelprofile };
export { getwatchhistory };
