import { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import ApiResponse from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async(req, res)=>{
    const{videoId}= req.params ; 
    if(!isValidObjectId(videoId)){
        throw new ApiError(401, "Video does not exist")
    }
    const isAlreadyLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if(!isAlreadyLiked){
        const giveALike = await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })
        if(!giveALike){
            throw new ApiError(500, "server error")
        }
        return res.status(200).json(
            new ApiResponse( 200, {liked: giveALike}, "Liked by you")
        )
    }

    const deleteLike = await Like.findByIdAndDelete(isAlreadyLiked?._id)
    if(!deleteLike){
        throw new ApiError(501, "server error")
    }
    return res.status(200)
    .json(new ApiResponse( 200, {deleted: deleteLike}, "Like removed by you"))
})

const toggleCommentLike = asyncHandler(async(req, res)=>{
    const{commentId}= req.params ; 
    if(!isValidObjectId(commentId)){
        throw new ApiError(401, "Comment does not exist")
    }
    const isAlreadyLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if(!isAlreadyLiked){
        const giveALike = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })
        if(!giveALike){
            throw new ApiError(500, "server error")
        }
        return res.status(200).json(
            new ApiResponse( 200, {liked: giveALike}, "Liked by you")
        )
    }

    const deleteLike = await Like.findByIdAndDelete(isAlreadyLiked?._id)
    if(!deleteLike){
        throw new ApiError(501, "server error")
    }
    return res.status(200)
    .json(new ApiResponse( 200, {deleted: deleteLike}, "Like removed by you"))
})

export {toggleVideoLike, toggleCommentLike}