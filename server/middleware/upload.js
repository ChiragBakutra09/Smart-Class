const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const cloudStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "smartclass",
    resource_type: "auto",
    allowed_formats: ["pdf", "doc", "docx", "png", "jpg", "jpeg", "ppt", "pptx", "zip"],
  },
});

const uploadFile = multer({
  storage: cloudStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadCSV = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isCSV = file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv");
    if (!isCSV) return cb(new Error("Only .csv files are accepted for roster upload."));
    cb(null, true);
  },
});

module.exports = { uploadFile, uploadCSV };
