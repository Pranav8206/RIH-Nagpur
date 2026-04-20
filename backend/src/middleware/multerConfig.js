import multer from "multer";
import os from "os";
import path from "path";

// Set up temporary storage using os.tmpdir()
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    // Sanitize the file name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9_\-\.]/g, "");
    cb(null, `${uniqueSuffix}-${sanitizedOriginalName}`);
  },
});

// File filter to allow only CSV files
const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === "text/csv" || fileExt === ".csv") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only CSV files are allowed."), false);
  }
};

// Multer configured upload middleware
export const uploadCSV = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
