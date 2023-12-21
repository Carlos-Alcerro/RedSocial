const express = require("express");
const router = express.Router();
const multer = require("multer");
const { auth } = require("../middlewares/auth");
const {
  crearUsuario,
  mostrarUsuarios,
  login,
  unUsuario,
  update,
  upload,
  avatar,
  counters,
} = require("../controllers/users");

//CONFIGURACION DE SUBIDA
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/avatars");
  },
  filename: (req, file, cb) => {
    cb(null, "avatar-" + Date.now() + "-" + file.originalname);
  },
});

const uploads = multer({ storage });

router.post("/usuario", crearUsuario);
router.post("/usuarios", login);
router.get("/usuarios/:page?", auth, mostrarUsuarios);
router.get("/usuario/:id", auth, unUsuario);
router.put("/update", auth, update);
router.post("/upload", [auth, uploads.single("image")], upload);
router.get("/avatar/:id", auth, avatar);
router.get("/counters/:id", auth, counters);

module.exports = router;
