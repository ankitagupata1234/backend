require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const File = require("./models/File");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: uploadPath,
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ================= ROUTES =================

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
    console.log(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/files", async (req, res) => {
  try {
    const files = await File.find().sort({ _id: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

app.get("/download/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.download(file.path, file.name);
  } catch (err) {
    res.status(500).json({ error: "Download failed" });
  }
});

app.get("/", (req, res) => {
  res.send("API running");
});

// ================= SERVER =================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});