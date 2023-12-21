const mongoose = require("mongoose")
const {Schema,model} = mongoose;

const SchemaFollow = Schema({
    user:{
        type:Schema.ObjectId,
        ref:"Users"
    },
    followed:{
        type:Schema.ObjectId,
        ref:"Users"
    },
    created_at:{
        type:Date,
        default:Date.now
    }
})

module.exports=model("Follow",SchemaFollow,"follow")