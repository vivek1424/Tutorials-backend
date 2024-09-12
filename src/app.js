import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//best practices for getting the data from different sources 
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser()) //for performing the crud operation on the cookies 

//routes 

import { userRouter } from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
//routes declaration 
app.use("/api/v1/users", userRouter)

app.use("/api/v1/videos", videoRouter)

app.use("/api/v1/comments", commentRouter)

app.use("/api/v1/likes", likeRouter)

app.use("/api/v1/subscription", subscriptionRouter)

app.use("/api/v1/playlist", playlistRouter)

//this will become like   users/register  it will first go to userRouter, then move on further

export default app