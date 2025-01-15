import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = 8000;

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("성공"))
  .catch((err) => console.log(err));
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
