const multer = require('multer');

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file
const MAX_FILES = 20;

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error(`File "${file.originalname}" is not a PDF`));
    }
    cb(null, true);
  },
});

module.exports = { upload, MAX_FILE_SIZE, MAX_FILES };
