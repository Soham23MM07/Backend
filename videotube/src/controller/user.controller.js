import { ApiError } from "../utils/Apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import {
  uploadtocloudinary,
  deletefromcloudniary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";
import mongoose, { mongo } from "mongoose";

const generateAccessRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      404,
      "something went wrong while creating accesstoken and refreshtoken",
    );
  }
};

const registeruser = asyncHandler(async (req, res) => {
  const { fullname, email, password, username } = req.body;

  if (
    [fullname, username, email, password].some(
      (fields) => fields?.trim() === "",
    )
  ) {
    throw new ApiError(400, "Fields Are Empty");
  }

  const existeduser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existeduser) {
    throw new ApiError(400, "User is already there");
  }

  const avatarLocalpath = req.files.avatar?.[0]?.path;
  const coverImageLocalpath = req.files.coverImage?.[0]?.path;

  if (!avatarLocalpath || !coverImageLocalpath) {
    throw new ApiError(400, "Files Not Found");
  }

  const avatar = await uploadtocloudinary(avatarLocalpath);
  const coverImage = await uploadtocloudinary(coverImageLocalpath);

  console.log("avatar", avatar.public_id, "Coverimage", coverImage.public_id);

  if (!avatar || !coverImage) {
    throw new ApiError(400, "Files Not Found");
  }
  console.log("avatar", avatar, "Coverimage", coverImage);

  const user = await User.create({
    fullname,
    email,
    password,
    username,
    avatar: avatar?.url,
    coverImage: coverImage?.url,
  });

  if (!user) {
    if (avatar) {
      await deletefromcloudniary(avatar?.public_id);
    }

    if (coverImage) {
      await deletefromcloudniary(coverImage?.public_id);
    }
  }

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  console.log(createdUser);

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong in createdUser");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User is Successfully Registered"));
});

const loginuser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;

  if ([username, password, email].some((fields) => fields?.trim() === "")) {
    throw new ApiError(400, "Invalid Username and Password");
  }

  const checkUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  console.log("Checkuser", checkUser);

  if (!checkUser) {
    throw new ApiError(400, "User is not registered please register first");
  }

  console.log("checkuserpassword", checkUser.password);
  console.log("password", password);

  const isPasswordCorrect = await checkUser.isPasswordCorrect(password);

  if (isPasswordCorrect === false) {
    throw new ApiError(400, "Password is incorrect");
  } else {
    console.log("Password is correct");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    checkUser._id,
  );

  const loggedin = await User.findById(checkUser._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, loggedin, "User is Successfully Logged In"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  console.log(req.cookies);
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    console.log(decodedToken);

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(400, "Invalid User");
    }

    if (incomingRefreshToken == !user?.refreshToken) {
      throw new ApiError(400, "Invalid refresh token");
    }

    const { accessToken, refreshToken: newrefreshToken } =
      await generateAccessRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
    console.log("accesToken", accessToken);

    console.log();

    console.log("newrefreshToken", newrefreshToken);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          user,
          "User has sucessfully generated new refresh and access  token",
        ),
      );
  } catch (error) {}
});

const logoutuser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
        accessToken: undefined,
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      status: "success",
      message: "User has successfully logged out",
    });
});

const changepassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;

  if ([oldpassword, newpassword].some((fields) => fields?.trim() === "")) {
    throw new ApiError(400, "Fields are empty");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "user not found");
  }
  console.log(user);

  const isPasswordValid = await user.isPasswordCorrect(oldpassword);
  if (!isPasswordValid) {
    throw new ApiError(404, "Password is incorrect");
  }

  user.password = newpassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Password is successfully Changed"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, user, "User Details"));
});

const updateAvatarandCoverImage = asyncHandler(async (req, res) => {
  const { avatar, coverImage } = req.body;

  if ([avatar, coverImage].some((fields) => fields?.trim() === "")) {
    throw new ApiError(400, "Fields are empty");
  }

  const avatarLocalpath = req.files.avatar?.[0]?.path;
  const coverImageLocalpath = req.files.coverImage?.[0]?.path;

  if (!avatarLocalpath || !coverImageLocalpath) {
    throw new ApiError(400, "Files Not Found");
  }

  const newavatar = await uploadtocloudinary(avatarLocalpath);
  const newcoverImage = await uploadtocloudinary(coverImageLocalpath);

  if (!newavatar || !newcoverImage) {
    throw new ApiError(400, "Files Not Found");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: newavatar.url,
        coverImage: newcoverImage.url,
      },
    },
    {
      new: true,
    },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated"));
});

const updateaccountdetails = asyncHandler(async (req, res) => {
  const { fullname } = req.body;

  if (fullname?.trim() === "") {
    throw new ApiError(400, "Fields are empty");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname,
      },
    },
    {
      new: true,
    },
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated"));
});

const getchannelprofile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Fields are empty");
  }

  const channel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
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
        subscribersCount: { $size: "$subscribers" },
        subscribedto: { $size: "$subscribedto" },
        issubscribed: { $in: [req.user._id, "$subscribedto", "subscribers"] },
      },
    },
    {
      $project: {
        _id: 1,
        username: 1,
        fullname: 1,
        avatar: 1,
        subscribersCount: 1,
        subscribedto: 1,
        issubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }
  console.log("channel:", channel);

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel Profile"));
});

const getplaylist = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "playlist",
        localField: "_id",
        forigenField: "video",
        as: "playlist",
        pipeline: [
          {
            $lookup: {
              from: "video  ",
              localField: "video",
              forigenField: "_id",
              as: "video",
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
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);
  if (!user?.length) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(new ApiResponse(200, user, "Playlist details"));
});

export { registeruser };
export { loginuser };
export { refreshAccessToken };
export { logoutuser };
export { changepassword };
export { getCurrentUser };
export { updateAvatarandCoverImage };
export { updateaccountdetails };
