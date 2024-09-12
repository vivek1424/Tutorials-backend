import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.control.js";
import { getUserPlaylist } from "../controllers/playlist.control.js";

const routers = Router()

routers.use(verifyJWT)

routers.route("/c/:channelId").get(getUserChannelSubscribers).post(toggleSubscription)
routers.route("/u/:subscriberId").get(getSubscribedChannels).delete()


export default routers 