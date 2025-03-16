import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destinationPath = path.join(__dirname, '../../images');
    // Check if the directory exists, create it if necessary
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }

    cb(null, destinationPath);
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

export default storage;
