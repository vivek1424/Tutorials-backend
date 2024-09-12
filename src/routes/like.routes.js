import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleCommentLike, toggleVideoLike } from "../controllers/like.control.js";

const router = Router()

router.use(verifyJWT)

router.route("/toggle/:videoId").post(toggleVideoLike)
router.route("/toggle/:commentId").post(toggleCommentLike)

export default router