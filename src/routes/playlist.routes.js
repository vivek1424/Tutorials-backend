import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addToPlaylist, createPlaylist, deletePlaylist, getUserPlaylist, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.control.js";
const router = Router()

router.use(verifyJWT)

router.route("/").post(createPlaylist) ;
router.route("/add/:videoId/:playlistId").post(addToPlaylist)
router.route("/:userId").get(getUserPlaylist)
router.route("/remove/:videoId/:playlistId").post(removeVideoFromPlaylist)
router.route("/:playlistId").patch(updatePlaylist).delete(deletePlaylist)

export default router; 