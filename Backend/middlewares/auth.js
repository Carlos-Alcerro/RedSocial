const jwt = require("jsonwebtoken");
const days = require("dayjs");
const { secret } = require("../services/jwt");

exports.auth = (req, res, next) => {
    // COMPROBAR SI LLEGA LA CABECERA AUTH
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: "Error",
            message: "La petición no tiene autenticación",
        });
    }

    // LIMPIAR EL TOKEN
    let token = req.headers.authorization && req.headers.authorization.split(" ").pop();

    // DECODIFICAR EL TOKEN
    try {
        let payload = jwt.verify(token, secret);

        // COMPROBAR EXPIRACION DEL TOKEN
        if (payload.exp <= days().unix()) {
            return res.status(401).send({
                status: "Error",
                message: "Token expirado",
            });
        }

        // AGREGAR DATOS DEL USUARIO A LA REQUEST
        req.user = payload;
        next();
    } catch (error) {
        console.log("ERROR JWT", error);
        return res.status(404).send({
            status: "Error",
            message: "Token inválido",
        });
    }
};
