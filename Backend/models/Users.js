const mongoose = require("mongoose")
const {Schema,model} = mongoose
const mongoosePaginate = require('mongoose-paginate-v2');

const SchemaUsers=Schema({
    name:{
        type:String,
        require:true
    },
    surname:String,
    bio:String,
    nick:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    role:{
        type:String,
        default:"role_user"
    },
    image:{
        type:String,
        default:"default.png"
    },
    created_at:{
        type:Date,
        default:Date.now
    }

})

SchemaUsers.plugin(mongoosePaginate);

module.exports=model("Users",SchemaUsers,"users")