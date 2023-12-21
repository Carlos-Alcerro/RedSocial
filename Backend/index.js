const express = require("express")
const cors = require("cors")
const {connection} = require("./database/connection")
require('dotenv').config();

const app = express()
connection()

app.use(cors())

app.use(express.json())
app.use(express.urlencoded({extended:true}))

const routesUser = require("./routes/user")
const routesPublication = require("./routes/publication")
const routesFollow = require("./routes/follow")

app.use("/api/user",routesUser)
app.use("/api/publication",routesPublication)
app.use("/api/follow",routesFollow)

const PORT = 3000

app.listen(PORT,()=>{
    console.log(`Servidor Corriendo en el puerto ${PORT}`)
})