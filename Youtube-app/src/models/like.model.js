// import { Schema } from "mongoose";
import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    comment: {
      type: String,
      requried: true,
    },

    description: {
      type: String,
      requried: true,
    },
    createdAt: {
      type: Number,
      requried: true,
    },
    updatedAt: {
      type: Number,
      requried: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },

    comment: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },

    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },

    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", userSchema);
