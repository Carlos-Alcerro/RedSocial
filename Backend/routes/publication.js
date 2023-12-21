const express = require("express");
const router = express.Router();
const multer = require("multer");
const { auth } = require("../middlewares/auth");
const {
  guardarPublicacion,
  mostrarPublicaciones,
  unaPublicacion,
  deletePublicacion,
  upload,
  image,
  feed,
} = require("../controllers/publication");

//CONFIGURACION DE SUBIDA
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/publications");
  },
  filename: (req, file, cb) => {
    cb(null, "pub-" + Date.now() + "-" + file.originalname);
  },
});

const uploads = multer({ storage });

router.post("/save", auth, guardarPublicacion);
router.get("/publications/:page?", auth, mostrarPublicaciones);
router.get("/:id", auth, unaPublicacion);
router.delete("/:id", auth, deletePublicacion);
router.post("/upload/:id", [auth, uploads.single("file")], upload);
router.get("/media/:file", auth, image);
router.get("/feed/:page?", auth, feed);

module.exports = router;
