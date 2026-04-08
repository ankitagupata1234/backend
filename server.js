require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const File = require("./models/File");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const storage = multer.diskStorage({
  destination: path.join(__dirname, "uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.array("files"), async (req, res) => {
  try {
    const files = req.files;

    const savedFiles = await Promise.all(
      files.map(file =>
        File.create({
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          path: file.path,
        })
      )
    );

    res.json(savedFiles);
  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});