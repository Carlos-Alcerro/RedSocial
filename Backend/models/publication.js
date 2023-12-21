const { Schema, model } = require("mongoose");
const paginate = require("mongoose-paginate-v2");

const SchemaPublication = Schema({
  user: {
    type: Schema.ObjectId,
    ref: "Users",
  },
  text: {
    type: String,
    require: true,
  },
  file: {
    type: String,
    default: "default.pgn",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

SchemaPublication.plugin(paginate);

module.exports = model("Publication", SchemaPublication, "publication");
