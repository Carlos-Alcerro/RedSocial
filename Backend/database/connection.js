const mongoose = require("mongoose")

const connection = async()=>{
    try {
        await mongoose.connect("mongodb+srv://carlosalcerrolainez2017:Carlos1999.@cluster0.gvrzcbm.mongodb.net/redsocial?retryWrites=true&w=majority")
        console.log("CONECTADO A LA BD")
    } catch (error) {
        console.log(error)
        throw new Error("No se pudo conectar a la base de datos")
    }
}

module.exports={connection}