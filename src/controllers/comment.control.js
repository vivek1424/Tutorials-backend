import { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
import ApiResponse from "../utils/ApiResponse.js";





const addComment = asyncHandler(async(req, res)=>{
    const {videoId}= req.params; 
    if(!isValidObjectId(videoId)){
        throw new ApiError(401, "Invalid video ID")
    }

    const {content}=req.body
    
    if(!content){
        throw new ApiError(400, "field is empty")
    }

    const createdComment = await Comment.create({
        content: content,
        video: videoId,
        owner: req.user?._id
    })

    if(!createdComment){
        throw new ApiError(400, "Something wrong while adding the comment")
    }

    return res.status(200).json(new ApiResponse(200, "Comment added succesfully", createdComment))
})


const getAllComments = asyncHandler(async(req, res)=>{
    const{videoId}= req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(401, "Invalid video ID")
    }
    const {page = 1, limit=10}= req.body; 
    const totalCount = await Comment.countDocuments({video: videoId})
    if(!totalCount){
        throw new ApiError(400, "comments not found on this video")
    }
    const skip = (page-1)*limit ; 

    const allComments = await Comment.find({video: videoId}).skip(skip).limit(limit)

    if(!allComments){
        throw new ApiError(400, "comments not obtained")
    }

    return res.status(200)
    .json( new ApiResponse(200, {comments: allComments}, "all the comments are obtained"))

})

const updateComment = asyncHandler(async(req, res)=>{
    const {commentId}= req.params ; 
    if(!isValidObjectId(commentId)){
        throw new ApiError(401, "invalid comment Id")
    }
    const {content}=req.body 
    if(!content){
        throw new ApiError(404, "Field is empty")
    }
    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(comment.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(402, "only the owner can edit")
    }
    
    const updatedcomment = await Comment.findByIdAndUpdate(commentId, 
        {
            $set: {
                content
            }
        },
        {new: true}
    )
    if(!updatedcomment){
        throw new ApiError(402, "comment could not be updated")
    }

    return res.status(200)
    .json(new ApiResponse(200, {comment: updatedcomment.content}, "Comment is updated"))
})


const deleteComment = asyncHandler(async(req, res)=>{
    const {commentId}= req.params; 
    if(!isValidObjectId(commentId)){
        throw new ApiError(401, "comment id invalid")
    }

    const findComment =await Comment.findById(commentId); 
 
    if(!findComment){
        throw new ApiError(404, "No such comment found")
    }

    if(findComment.owner.toString()!== req.user?._id.toString() ){
        throw new ApiError(400, "Only owner can delete the comment")
    }

    const deleted = await Comment.findByIdAndDelete(commentId);
    if(!deleted){
        throw new ApiError(400, "Something went wrong while deleting" )
    }

    return res.status(200).json(new ApiResponse(200, {deleted}, "comment has been deleted"))
})


const getMyComment = asyncHandler(async(req, res)=>{
    const myComment = await Comment.aggregate([
        {
            $match:{
                owner: req.user?._id
            }
        }
    ])
    if(!myComment){
        throw new ApiError(400, "You have no comment" )
    }
    res.status(200)
    .json(new ApiResponse(200, {comment: myComment}, "Your comment is here"))
})

export {addComment, 
    deleteComment, 
    updateComment,
    getAllComments,
    getMyComment
}