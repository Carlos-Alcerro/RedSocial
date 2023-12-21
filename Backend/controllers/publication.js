const Publication = require("../models/publication");
const validator = require("validator");
const fs = require("fs");
const path = require("path");
const servicesFollows = require("../services/followUsersId");

//GUARDAR PUBLICACION
const guardarPublicacion = async (req, res) => {
  try {
    const parametros = req.body;
    const { id } = req.user;

    let validar_text =
      !validator.isEmpty(parametros.text) &&
      validator.isLength(parametros.text, { min: 10, max: undefined });

    if (!id || !validar_text) {
      return res.status(400).json({
        status: "Error",
        message: "Hubo un error en el envio de los datos",
      });
    }

    const nuevaPublicacion = new Publication({ ...parametros, user: id });

    if (!nuevaPublicacion) {
      return res.status(404).json({
        status: "Error",
        message: "Error al realizar la publicacion",
      });
    }

    const publicacionGuardada = await nuevaPublicacion.save();

    return res.status(200).json({
      status: "Exito",
      publicacionGuardada,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Error",
      message: "Error al realizar la peticion",
    });
  }
};

//LISTAR TODAS LAS PUBLICAIONES
const mostrarPublicaciones = async (req, res) => {
  try {
    const { id } = req.user;
    const { page } = req.params;
    const itemsPerPage = 5;

    const options = {
      page: parseInt(page, 10) || 1,
      limit: itemsPerPage,
      sort: { created_at: -1 }, // Ordenar por fecha de creación descendente
      populate: { path: "user", select: "-password -__v -created_at -role" },
    };

    const result = await Publication.paginate({ user: id }, options);

    if (!result.docs || result.docs.length === 0) {
      return res.status(404).json({
        status: "Error",
        message: "No se encontraron publicaciones",
      });
    }

    return res.status(200).json({
      status: "Exito",
      publicaciones: result.docs,
      totalPages: result.totalPages,
      currentPage: result.page,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: "No se pudo realizar la petición",
    });
  }
};

//SACAR UNA SOLA PUBLICACION
const unaPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const publicaciones = await Publication.findOne({ _id: id }).exec();
    if (!publicaciones || publicaciones.length === 0) {
      return res.status(404).json({
        status: "Error",
        message: "No se encontraron publicaciones",
      });
    }
    return res.status(200).json({
      status: "Exito",
      publicaciones,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: "No se pudo realizar la peticion",
    });
  }
};

//ELIMINAR PUBLICACION
const deletePublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const publicaciones = await Publication.findOneAndDelete({
      _id: id,
    }).exec();
    if (!publicaciones || publicaciones.length === 0) {
      return res.status(404).json({
        status: "Error",
        message: "No se encontraron publicaciones",
      });
    }
    return res.status(200).json({
      status: "Publicacion eliminada exitosamente",
    });
  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: "No se pudo realizar la peticion",
    });
  }
};

//SUBIR FICHEROS
const upload = async (req, res) => {
  try {
    const publicationId = req.params.id;
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
    const publicacionActualizado = await Publication.findOneAndUpdate(
      { user: req.user.id, _id: publicationId },
      { file: req.file.filename },
      { new: true }
    );

    //DEVOLVER UNA RESPUESTA
    return res.status(200).json({
      status: "Exito",
      publicacionActualizado: publicacionActualizado,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Error",
      message: "No se pudo realizar la peticion",
    });
  }
};

//DEVOLVER ARCHIVOS MULTIMEDIA
const image = async (req, res) => {
  try {
    const file = req.params.file;
    const filePath = "./uploads/publications/" + file;

    fs.stat(filePath, (error, exist) => {
      if (!exist) {
        return res.status(404).json({
          status: "Error",
          message: "No existe la imagen",
        });
      }
      return res.sendFile(path.resolve(filePath));
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Error",
      message: "Se produjo un error al realzar la peticion",
    });
  }
};

//LISTAR TODAS LAS PUBLICACIONES (FEED)
const feed = async (req, res) => {
  //SACAR LA PAGINA ACTUAL
  let page = 1;

  if (req.params.page) {
    page = req.params.page;
  }

  //ESTABLECER NUMERO DE ELEMENTOS POR PAGINA
  let itemsPerpage = 5;

  //SACAR UN ARRAY DE IDENTIFICADORES DE USUARIO QUE YO SIGO COMO USUARIO LOGUEADO
  try {
    const myFollows = await servicesFollows.followUsersId(req.user.id);

    if (!myFollows || myFollows.length === 0) {
      return res.status(400).json({
        status: "Error",
        message: "No se pudo obtener seguidores",
      });
    }

    const options = {
      page: parseInt(page, 10) || 1,
      limit: itemsPerpage,
      sort: { created_at: -1 }, // Ordenar por fecha de creación descendente
      populate: { path: "user", select: "-password -__v -role -email" },
    };

    //FIND A PUBLICACIONES CON IN, ORDENAR, POPULAR, PAGINAR
    const publication = await Publication.paginate(
      {
        user: { $in: myFollows.following },
      },
      options
    );

    return res.status(200).json({
      status: "Exito",
      following: myFollows.following,
      publication,
      totalPages: publication.totalPages,
      currentPage: publication.page,
      documentos: publication.totalDocs,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Error",
      message: "No se han listado publicaciones",
    });
  }
};

module.exports = {
  guardarPublicacion,
  mostrarPublicaciones,
  unaPublicacion,
  deletePublicacion,
  upload,
  image,
  feed,
};
