import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getAllVideos, updateThumbnail, updateViews, uploadVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()
router.use(verifyJWT)


router.route("/")
.get(getAllVideos)
.post(
    upload.fields( [
        {
            name: "videoFile",
            maxCount:1
        },
        {
            name: "thumbnail",
            maxCount:1 
        }
    ]),
    uploadVideo
)

router.route("/:videoId")
.delete(deleteVideo)
.get(updateViews)


router.route("/update-thumbnail/:videoId").patch(
    upload.fields( [
        {
            name: "thumbnail",
            maxCount:1 
        }
    ]),
    updateThumbnail)

export default router ; 