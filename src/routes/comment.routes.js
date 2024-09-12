import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getAllComments, getMyComment, updateComment } from "../controllers/comment.control.js";

const router = Router()

router.use(verifyJWT)

router.route("/:videoId").post(addComment).get(getAllComments)

router.route("/:commentId").delete(deleteComment).patch(updateComment)

router.route("/getmycomment").get(getMyComment)
export default router
