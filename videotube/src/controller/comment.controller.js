import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/Apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.models.js";
import { ApiResponse } from "../utils/Apiresponse.js";

const addcomment = asyncHandler(async (req, res) => {
  const _id = req.user._id;
  if (!_id) {
    throw new ApiError(400, "Id NOT FOUND");
  }

  const { text } = req.body;
  if (!text) {
    throw new ApiError(400, "Content is missing");
  }

  const video = await Video.findOne(
    {
      owner: _id,
    },
    {
      comments: 1,
    },
  );

  const comment = await Comment.create({
    owner: _id,
    content: text,
    video: video._id,
  });

  video.comments.push(text);

  await video.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, comment, "Comment Added"));
});
const deletecomment = asyncHandler(async (req, res) => {
  const _id = req.user._id;
  if (!_id) {
    throw new ApiError(400, "Id NOT FOUND");
  }

  const comment = await Comment.findOne({
    owner: _id,
  });

  comment.content = "";

  if (!comment) {
    throw new ApiError(404, "Comment Not Found");
  }

  return res.status(200).json(new ApiResponse(200, comment, "Comment Deleted"));
});

export { addcomment };
export { deletecomment };
