import { Router } from "express";
import {changeCurrentPassword, getCurrentUser, getWatchHistory, guestUserChannelProfile, loginUser, logoutUser, refreshAcessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router()

//use the middleware just before the method 
userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)


userRouter.route("/login").post(loginUser)

//secured routes

userRouter.route("/logout").post(verifyJWT, logoutUser)
userRouter.route("/refresh-token").post(refreshAcessToken)
userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword)
userRouter.route("/current-user").get(verifyJWT, getCurrentUser)
userRouter.route("/update-account").patch(verifyJWT, updateAccountDetails)
userRouter.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
userRouter.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
userRouter.route("/c/:username").get(verifyJWT, guestUserChannelProfile)
userRouter.route("/history").get(verifyJWT, getWatchHistory)

export {userRouter} 

