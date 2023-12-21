const express = require("express")
const router = express.Router()
const {save,unfollow,following,followers} = require("../controllers/follow")
const {auth} = require("../middlewares/auth")

router.post("/save",auth,save)
router.delete("/unfollow/:id",auth,unfollow)
router.get("/following/:id",auth,following)
router.get("/followers/:id",auth,followers)


module.exports=router;