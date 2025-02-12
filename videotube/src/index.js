import { app } from "./app.js";
import dontenv from "dotenv";
import { connectDB } from "./db/index.js";

dontenv.config({
  path: "./.env",
});

const port = process.env.PORT || 2000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is listening to ${port}`);
    });
  })
  .catch((err) => {
    console.log("mongodb connection error", err);
  });
