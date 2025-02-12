import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/Apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import {
  uploadtocloudinary,
  deletefromcloudniary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const videoFiles = req.files?.videoFile?.[0]?.path; // Get all uploaded video files
  if (!videoFiles || videoFiles.length === 0) {
    throw new ApiError(404, "No video files uploaded");
  }

  const uploaded = await uploadtocloudinary(videoFiles);

  if (!uploaded) {
    throw new ApiError(404, "Failed to upload video");
  }
  const uploadedVideos = [uploaded.url];

  // Fetch the existing video record for the user
  let video = await Video.findOne({ owner: req.user._id });

  if (!video) {
    // Create a new video document if none exists
    video = await Video.create({
      title: [title], // Store title as an array
      description: [description], // Store description as an array
      videoFile: uploadedVideos, // Add the new files
      isPublished: true,
      owner: req.user._id,
      username: req.user.username, // Assuming `req.user.username` is available
    });
  } else {
    // Append new titles, descriptions, and videos
    video.title = [...video.title, title]; // Append title
    video.description = [...video.description, description]; // Append description
    video.videoFile = [...video.videoFile, ...uploadedVideos]; // Append video files
    await video.save();
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        "Videos, title, and description added successfully",
      ),
    );
});

const getvideobyId = asyncHandler(async (req, res) => {
  const _id = req.user._id;

  if (!_id) {
    throw new ApiError(400, "Id NOT FOUND");
  }

  const video = await Video.findOne(
    {
      owner: _id,
    },
    {
      videoFile: 1,
    },
  );

  if (!video) {
    throw new ApiError(404, "Video NOT FOUND");
  }

  console.log("video", video);

  const videoFile = video.videoFile;

  if (!videoFile) {
    throw new ApiError(404, "Video File Not Found");
  }
  console.log("videoFile", videoFile);

  return res
    .status(200)
    .json(new ApiResponse(200, videoFile, "Video Fetched Successfully"));
});

const getvideoupdated = asyncHandler(async (req, res) => {
  const videoFile = req.body;

  if (!videoFile) {
    throw new ApiError(400, "VideoFile NOT FOUND");
  }

  const videofilelocalpath = req.files.videoFile?.[0]?.path;
  if (!videofilelocalpath) {
    throw new ApiError(404, "Video Path Not Found");
  }

  const newvideo = await uploadtocloudinary(videofilelocalpath);

  if (!newvideo) {
    throw new ApiError(404, "Video not found");
  }

  console.log(req.user._id);
  const _id = req.user._id;

  const video = await Video.findOne(
    {
      owner: _id,
    },
    {
      videoFile: 1,
    },
  );

  console.log(video);

  video.videoFile = newvideo.url;

  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(400, video, "VIDEO UPLOADED SUCCESSFULLY"));
});

const deletevideo = asyncHandler(async (req, res) => {
  const _id = req.user._id;

  if (!_id) {
    throw new ApiError(400, "ID is missing");
  }

  const video = await Video.findOne(
    { owner: _id },
    {
      videoFile: 1,
      title: 1,
      description: 1,
    },
  );

  if (!video) {
    throw new ApiError(404, "No videos found for this user");
  }

  const videoFiles = video.videoFile;
  const titles = video.title;
  const descriptions = video.description;

  if (!videoFiles || videoFiles.length === 0) {
    throw new ApiError(404, "No video files found to delete");
  }

  try {
    // Use Promise.all to handle async deletions

    videoFiles.map(async (fileUrl) => {
      const videoPublicId = fileUrl.split("/").pop().split(".")[0]; // Extract public ID
      await deletefromcloudniary(videoPublicId); // Delete from Cloudinary
    }),
      // Clear videoFile array in the database
      (video.videoFile = []);
    video.title = [];
    video.description = [];
    await video.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Videos deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to delete videos: " + error.message);
  }
});

const deletespecificvideo = asyncHandler(async (req, res) => {
  const _id = req.user._id;

  if (!_id) {
    throw new ApiError(400, "ID is missing");
  }

  const video = await Video.findOne(
    { owner: _id },
    {
      videoFile: 1,
      title: 1,
      description: 1,
    },
  );

  if (!video) {
    throw new ApiError(404, "No videos found for this user");
  }

  const { url, title, description } = req.body;

  if (!url) {
    throw new ApiError(400, "URL is missing");
  }

  try {
    // Delete video from Cloudinary

    video.videoFile = video.videoFile.filter(async (fileUrl) => {
      if (fileUrl === url) {
        const videoPublicId = fileUrl.split("/").pop().split(".")[0]; // Extract public ID
        await deletefromcloudniary(videoPublicId); // Delete from Cloudinary
        return false; // Remove from array
      }
      return true;
    });

    video.videoFile.forEach((element) => {
      if (element === url) {
        element = "";
      }
    });

    video.title.forEach((element) => {
      if (element === title) {
        element = "";
      }
    });

    video.description.forEach((element) => {
      if (element === description) {
        element = "";
      }
    });

    // Save the updated video document
    await video.save();

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Videos deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to delete videos: " + error.message);
  }
});

export { publishVideo };
export { getvideoupdated };
export { getvideobyId };
export { deletevideo };
export { deletespecificvideo };
