// import { Schema } from "mongoose";
import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    name: {
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
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", userSchema);
