const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app.js");
const cloudinary = require("cloudinary");

dotenv.config();

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

// const DB =
//   "mongodb+srv://finalProjectDemo:<PASSWORD>@cluster0.gftyeri.mongodb.net/finalProjectDemo?retryWrites=true&w=majority".replace(
//     "<PASSWORD>",
//     "Fullhouse1"
//   );

mongoose.connect(DB).then(() => {
  console.log("MongoDB Connected!");
});

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
