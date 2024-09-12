import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";
import ApiResponse from "../utils/ApiResponse.js";


const toggleSubscription = asyncHandler(async(req, res)=>{
    const {channelId}= req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(401, "Invalid channel id")
    }  

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    });

    if(!isSubscribed){
        const subscribeToChannel = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        })
    
        return res.status(200)
        .json(new ApiResponse(200, {subscribeToChannel}, "Subscribed to the channel"))
    }

    const unsubscribe = await Subscription.findByIdAndDelete(isSubscribed?._id)
    if(!unsubscribe){
        throw new ApiError(500, "Server error")
    }
    return res.status(200)
    .json(new ApiResponse(200, {unsubscribe}, "Unsubscribed the channel"))

})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(401, "Invalid channel id")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },
        {
            $unwind: "$subscribers"
        },
        {
            $project: {
                _id: 1,
                subscriber: {
                    _id: "$subscribers._id",
                    username: "$subscribers.username",
                    fullname: "$subscribers.fullname",
                    avatar: "$subscribers.avatar"
                }
            }
        }
    ])

    if (!subscribers) {
        throw new ApiError(401, "server error")
    }

    return res.status(200)
    .json(new ApiResponse(200, {subscribers: subscribers}, "These are the subscribers of your channel"))
})


const getSubscribedChannels = asyncHandler(async(req, res)=>{
    const {subscriberId}=req.params 
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(401, "Invalid subscriber id")
    }

    const allSubscribedChannels = await Subscription.aggregate([
        {
            $match: {
                 subscriber: new mongoose.Types.ObjectId(subscriberId)
        }
    }
        ,
        {
            $lookup:{
                from: "users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedChannels"
            }
        },
        {
            $unwind:"$subscribedChannels"
        },
        {
            $project: {
                _id: 1,
                subscribedChannel: {
                    _id: "$subscribedChannels._id",
                    username: "$subscribedChannels.username",
                    fullname: "$subscribedChannels.fullname",
                    avatar: "$subscribedChannels.avatar"
                }
            }
        }
    ])

    if(!allSubscribedChannels){
        throw new ApiError(401, "Server error")
    }

    return res.status(200)
    .json(new ApiResponse(200, {subscribedChannels: allSubscribedChannels},"These are the channels subscribed" ))

})


export {getUserChannelSubscribers,toggleSubscription, getSubscribedChannels}