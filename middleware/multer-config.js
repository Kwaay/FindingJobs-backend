const multer = require('multer');

// Sélection des extensions autorisées
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/bmp': 'bmp',
  'image/svg': 'svg',
  'image/gif': 'gif',
};
/**
 * @function multer This function indicates where the image should be saved,
 * and format the filename according to if the file already contains a extension or not
 * @param {object} req - The request object
 * @param {object} file - The file object containing the image
 * @param {object} callback - The callback function
 *
 * @returns {void}
 */
const storage = multer.diskStorage({
  // Indication de l'endroit où stocker les fichiers récuperés
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  // Format du nom de l'image
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    if (name.endsWith(`.${extension}`)) {
      callback(null, `${Date.now()}_${name}`);
    } else {
      callback(null, `${Date.now()}_${name}.${extension}`);
    }
  },
});

module.exports = multer({
  storage,
  limits: {
    fileSize: 52428800,
    files: 1,
  },
}).fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);
