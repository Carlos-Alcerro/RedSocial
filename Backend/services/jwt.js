const jwt = require("jsonwebtoken");
const days = require("dayjs")

const secret = process.env.SECRET_HASH

//FUNCION PARA GENERAR EL TOKEN
const createToken=(user)=>{
    const payload={
        id:user._id,
        name:user.name,
        surname:user.surname,
        nick:user.nick,
        email:user.email,
        bio:user.bio,
        role:user.role,
        image:user.image,
        iat:days().unix(),
        exp:days().add(30,"days").unix()

    }

    //DEVOLVER EL JWT CODIFICADO
    return jwt.sign(payload,secret);
}

module.exports={createToken,secret}