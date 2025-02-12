//  id string
//   videos objectId[]video
//   createdAt Date
//   updatedAt Date
//   owner ObjectId[]user
//   title string

import mongoose, { Schema } from "mongoose";

const playlistSchem = new Schema(
  {
    name: {
      type: String,
      requried: true,
    },

    description: {
      type: String,
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
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);
export const Playlist = mongoose.model("Playlist", Schema);
