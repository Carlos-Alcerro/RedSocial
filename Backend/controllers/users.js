const User = require("../models/Users");
const validator = require("validator");
const bcrypt = require("bcrypt");
const fs = require("fs");
const jwt = require("../services/jwt");
const followServices = require("../services/followUsersId");
const Follow = require("../models/follow");
const Publication = require("../models/publication");

const crearUsuario = async (req, res) => {
  const parametros = req.body;

  try {
    let validar_nombre =
      !validator.isEmpty(parametros.name) &&
      validator.isLength(parametros.name, { min: 5, max: undefined });
    let validar_email =
      !validator.isEmpty(parametros.email) &&
      validator.isLength(parametros.email, { min: 5, max: undefined });
    let validar_password =
      !validator.isEmpty(parametros.password) &&
      validator.isLength(parametros.password, { min: 5, max: undefined });
    let validar_nick =
      !validator.isEmpty(parametros.nick) &&
      validator.isLength(parametros.nick, { min: 5, max: undefined });

    if (
      !validar_nombre ||
      !validar_email ||
      !validar_password ||
      !validar_nick
    ) {
      throw new Error("Datos Incorrectos");
    }

    // CONTROLAR USUARIOS DUPLICADOS
    const usuarioExiste = await User.findOne({
      $or: [
        { email: parametros.email.toLowerCase() },
        { nick: parametros.nick.toLowerCase() },
      ],
    });

    if (usuarioExiste) {
      return res.status(400).json({
        status: "Error",
        message: "El usuario ya existe",
      });
    }

    // CIFRAR CONTRASEÑA
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(parametros.password, saltRounds);
    parametros.password = hashedPassword;

    // GUARDAR EL USUARIO NUEVO
    const usuario_nuevo = new User(parametros);
    const usuarioGuardado = await usuario_nuevo.save();

    return res.status(200).json({
      status: "Exito",
      usuario_nuevo: usuarioGuardado,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(404).json({
      status: "Error",
      message: "Hubo un error en los datos",
    });
  }
};

const login = async (req, res) => {
  //RECOGER PARAMETROS DEL BODY
  const parametros = req.body;

  if (!parametros.email || !parametros.password) {
    return res.status(400).json({
      status: "Error",
      message: "Faltan datos por enviar",
    });
  }

  //VERIFICAR SIN EN LA BD EXISTE EL USUARIO
  const usuarioExiste = await User.findOne({
    email: parametros.email,
  }); //.select({"password":0})

  if (!usuarioExiste) {
    return res.status(400).json({
      status: "Error",
      message: "No existe el usuario",
    });
  }

  //COMPROBAR LA CONTRASENA
  const comparePassword = bcrypt.compareSync(
    parametros.password,
    usuarioExiste.password
  );

  if (!comparePassword) {
    return res.status(400).json({
      status: "Error",
      message: "No te has identificado correctamente",
    });
  }

  //DEVOLVER TOKEN
  const token = jwt.createToken(usuarioExiste);

  //DEVOLVER DATOS DE USUARIO
  return res.status(200).json({
    status: "Exito",
    usuarioExiste: {
      namme: usuarioExiste.name,
      email: usuarioExiste.email,
      surname: usuarioExiste.surname,
      nick: usuarioExiste.nick,
      image: usuarioExiste.image,
    },
    token,
  });
};

const unUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await User.findById(id).exec();

    if (!usuario || usuario.length === 0) {
      return res.status(404).json({
        status: "Error",
        message: "No se encontro este usuario",
      });
    }

    //INFO DE SEGUIMIENTO
    const followInfo = await followServices.followThisUser(req.user.id, id);

    return res.status(200).json({
      status: "Exito",
      usuario: {
        name: usuario.name,
        surname: usuario.surname,
        email: usuario.email,
        image: usuario.image,
        nick: usuario.nick,
      },
      following: followInfo.following,
      followers: followInfo.followers,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Error",
      message: "Error al ejecutar la peticion",
    });
  }
};

const mostrarUsuarios = async (req, res) => {
  const { page } = req.params;

  try {
    const options = {
      page: parseInt(page, 10) || 1, // Página actual, predeterminada a 1 si no se proporciona
      limit: 5, // Número de usuarios por página
      select: "-password",
    };

    const usuarios = await User.paginate({}, options);

    if (!usuarios.docs || usuarios.docs.length === 0) {
      return res.status(404).json({
        status: "Error",
        message: "No se encuentran usuarios",
      });
    }

    let followUserId = await followServices.followUsersId(req.user.id);

    return res.status(200).json({
      status: "Exito",
      Usuarios: usuarios.docs,
      total_pages: usuarios.totalPages,
      current_page: usuarios.page,
      user_following: followUserId.following,
      user_follow_me: followUserId.followers,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Error",
      message: "Se produjo un error al realizar la peticion",
    });
  }
};

const update = async (req, res) => {
  try {
    // Recoger información del usuario a actualizar
    let usuarioUpdate = req.body;
    let usuarioAutenticado = req.user;

    // Buscar usuario existente por email o nick
    const usuarioExistente = await User.findOne({
      $or: [
        { email: usuarioUpdate.email.toLowerCase() },
        { nick: usuarioUpdate.nick.toLowerCase() },
      ],
    });

    // Si existe un usuario con el mismo email o nick y no es el mismo usuario autenticado
    if (
      usuarioExistente &&
      usuarioExistente._id.toString() !== usuarioAutenticado.id
    ) {
      return res.status(400).json({
        status: "Error",
        message: "El email o nick ya está en uso por otro usuario",
      });
    }

    // Cifrar contraseña si llega
    if (usuarioUpdate.password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        usuarioUpdate.password,
        saltRounds
      );
      usuarioUpdate.password = hashedPassword;
    }

    // Actualizar cualquier campo del usuario autenticado
    const updatedUser = await User.findByIdAndUpdate(
      usuarioAutenticado.id,
      { $set: usuarioUpdate },
      { new: true } // Devuelve el documento actualizado
    );

    return res.status(200).json({
      status: "Éxito",
      usuario: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno del servidor",
    });
  }
};

const upload = async (req, res) => {
  try {
    //RECOGER EL FICHERO DE LA IMAGEN Y COMPROBAR QUE EXISTA
    if (!req.file) {
      return res.status(404).json({
        status: "Error",
        message: "La peticion no incluye una imagen",
      });
    }

    //CAPTURAR EL NOMBRE DEL ARCHIVO
    let image = req.file.originalname;

    //SACAR LA EXTENSION DEL ARCHIVO
    const imageSplit = image.split(".");
    const extension = imageSplit[1];

    //COMPROBAR EXTENSION
    if (
      extension != "jpg" &&
      extension != "jpeg" &&
      extension != "png" &&
      extension != "gif"
    ) {
      //BORRAR EL ARCHIVO
      const filePath = req.file.path;
      const removeFile = fs.unlinkSync(filePath);

      return res.status(400).json({
        status: "Error",
        message: "Extension del fichero invalida",
      });
    }

    //SI ES CORRECTO, GUARDAMOS LA IMAGEN EN LA BD
    const avatarActualizado = await User.findOneAndUpdate(
      { _id: req.user.id },
      { image: req.file.filename },
      { new: true }
    );

    //DEVOLVER UNA RESPUESTA
    return res.status(200).json({
      status: "Exito",
      avatarActualizado: avatarActualizado,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Error",
      message: "No se pudo realizar la peticion",
    });
  }
};

const avatar = async (req, res) => {
  const { id } = req.params;
  try {
    const avatarUser = await User.findOne({ _id: id });

    if (!avatarUser) {
      return res.status(404).json({
        status: "Error",
        message: "No se encontro este avatar",
      });
    }
    const image = avatarUser.image;
    return res.status(200).json({
      status: "Exito",
      image,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Error",
      message: "No se pudo realizar esta peticion",
    });
  }
};

const counters = async (req, res) => {
  try {
    let idUser = req.user.id;

    if (req.params.id) {
      idUser = req.params.id;
    }

    const followingCount = await Follow.countDocuments({
      user: idUser,
    });

    const followedCount = await Follow.countDocuments({ followed: idUser });

    const publicationCount = await Publication.countDocuments({ user: idUser });

    return res.status(200).json({
      status: "Éxito",
      following: followingCount,
      followed: followedCount,
      public: publicationCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "Error",
      message: "No se pudo ejecutar la petición",
    });
  }
};

module.exports = {
  crearUsuario,
  mostrarUsuarios,
  login,
  unUsuario,
  update,
  upload,
  avatar,
  counters,
};
