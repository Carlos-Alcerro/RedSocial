const Follow = require("../models/follow");
const User = require("../models/Users");
const followServices = require("../services/followUsersId");

//ACCION DE SEGUIR
const save = async (req, res) => {
  try {
    //CONSEGUIR DATOS POR BODY
    const params = req.body;

    //SACAR ID DE USUARIO IDENTIFICADO
    const identity = req.user;

    //VERIFICAR QUE SE ESTE PASANDO EL FOLLOW POR EL BODY
    if (!params.followed) {
      return res.status(404).json({
        status: "Error",
        message: "No se pudo realizar la solicitud",
      });
    }

    //CREAR UN OBJETO CON MODELO FOLLOW
    let userFollow = new Follow({
      user: identity.id,
      followed: params.followed,
    });

    try {
      const followGuardado = await userFollow.save();
      return res.status(200).json({
        status: "Exito",
        followGuardado,
      });
    } catch (error) {
      return res.status(400).json({
        status: "Error",
        message: "No se pudo realizar el follow",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Error",
      message: "No se pudo realizar la peticion",
    });
  }
};
//ACCION DE DEJAR SEGUIR
const unfollow = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    if (!id) {
      return res.status(400).json({
        status: "Error",
        message: "Formato de ID no válido",
      });
    }

    // Buscar y eliminar el follow
    const followDelete = await Follow.findOneAndDelete({
      user: userId,
      followed: id,
    }).exec();

    if (!followDelete) {
      return res.status(404).json({
        status: "Error",
        message: "No has dejado de seguir a nadie",
      });
    }

    return res.status(200).json({
      status: "Exito",
      followDelete,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "Error",
      message: "Error al realizar la petición",
      error: error.message,
    });
  }
};

//TODOS LOS USUARIOS QUE ESTOY SIGUIENDO
const following = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar todos los documentos en Follow donde el campo 'user' sea igual a tu ID de usuario
    const follows = await Follow.find({ user: userId }).populate(
      "followed",
      "-password -role -__v"
    );

    // Extraer la información de los usuarios seguidos
    const followingUsers = follows.map((follow) => follow.followed);

    let followUserId = await followServices.followUsersId(req.user.id);

    if (!followingUsers || followingUsers.length === 0) {
      return res.status(404).json({
        status: "Error",
        message: "No se encontraron usuarios que sigas",
      });
    }

    return res.status(200).json({
      status: "Éxito",
      followingUsers,
      user_following: followUserId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "Error",
      message: "Error al realizar la petición",
      error: error.message,
    });
  }
};

//LISTADO DE USUARIOS QUE ME SIGUEN
const followers = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar todos los documentos en Follow donde el campo 'followed' sea igual a tu ID de usuario
    const followers = await Follow.find({ followed: userId }).populate(
      "user",
      "-password -role -__v"
    );

    // Extraer la información de los usuarios que te siguen
    const followersUsers = followers.map((follow) => follow.user);

    if (!followersUsers || followersUsers.length === 0) {
      return res.status(404).json({
        status: "Error",
        message: "No se encontraron usuarios que te sigan",
      });
    }

    return res.status(200).json({
      status: "Éxito",
      followersUsers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "Error",
      message: "Error al realizar la petición",
      error: error.message,
    });
  }
};

module.exports = { save, unfollow, following, followers };
