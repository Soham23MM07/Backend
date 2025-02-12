import cloudinary from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.CLOUD_NAME); // Should output your Cloudinary name
console.log(process.env.API_KEY); // Should output your API key
console.log(process.env.API_SECRET); // Should output your API secret

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadtocloudinary = async (localfilePath) => {
  console.log(localfilePath);

  try {
    if (!localfilePath) return null;

    const response = await cloudinary.uploader.upload(localfilePath, {
      resource_type: "auto",
    });

    console.log("File uploaded to Cloudinary:", response);

    // Delete the local file after uploading to Cloudinary
    await fs.promises.unlink(localfilePath);
    return response;
  } catch (error) {
    console.log("Error uploading file to Cloudinary:", error.message);
    console.log("Cloudinary erro details:", error);
    // Delete the local file even if upload fails
    await fs.promises.unlink(localfilePath);
    return null;
  }
};

const deletefromcloudniary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary file deleted:", result);
  } catch (error) {
    console.log("Error deleting from Cloudinary:", error.message);
    return null;
  }
};

export { uploadtocloudinary, deletefromcloudniary };
