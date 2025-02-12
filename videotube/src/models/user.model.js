//   id string
//   username string
//   fullname string
//   email string
//   password string
//   avatar files
//   coverImage files
//   createdAt Date
//   updatedAt Date
//   watchhistory ObjectId[] Videos
import jwt from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,

      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    avatar: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    watchhistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    refreshToken: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// PRE HOOK FOR ENCRYPTION
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// METHOD TO CHECK PASSWORD IS CORRECT OR NOT
userSchema.methods.isPasswordCorrect = async function (password) {
  console.log("Provided password:", password);
  console.log("Hashed password:", this.password);
  return await bcrypt.compare(password, this.password);
};

// METHOD TO GENERATE ACCESS TOKEN

userSchema.methods.generateAccessToken = async function () {
  // short lived access token

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};

userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};

export const User = mongoose.model("User", userSchema);
