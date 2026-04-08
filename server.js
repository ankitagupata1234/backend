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

// ================= MONGO CONNECT =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// ================= UPLOAD FOLDER =================
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

// Serve uploads folder statically (optional, for direct browser access)
app.use("/uploads", express.static(uploadPath));

// ================= MULTER CONFIG =================
const storage = multer.diskStorage({
  destination: uploadPath,
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// ================= ROUTES =================

// Upload files
app.post("/upload", upload.array("files"), async (req, res) => {
  try {
    const files = req.files;
    const savedFiles = await Promise.all(
      files.map(file =>
        File.create({
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          path: file.path, // local path
        })
      )
    );
    res.json(savedFiles);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Get all files
app.get("/files", async (req, res) => {
  try {
    const files = await File.find().sort({ _id: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Download file by ID
app.get("/download/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    res.download(file.path, file.name);
  } catch (err) {
    res.status(500).json({ error: "Download failed" });
  }
});

// Delete file by ID
app.delete("/files/:id", async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    // Delete actual file from server
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// Test route
app.get("/", (req, res) => res.send("API running"));

// ================= SERVER =================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));