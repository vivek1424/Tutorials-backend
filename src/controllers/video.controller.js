import { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import  {uploadOnCloudinary, deleteImageFromCloudinary, deleteVideoFromCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";



const getAllVideos = asyncHandler(async (req, res) => {
    //algorithm 
    const { page = 1, limit = 2, userId } = req.body;

    if (!isValidObjectId(userId)) {
        throw new ApiError(404, "User not found")
    }

    const totalVideos = await Video.countDocuments({ owner: userId })

    console.log("total videos", totalVideos);

    const totalPage = Math.ceil(totalVideos / limit)
    let skip = (page - 1) * limit

    const videos = await Video.find({ owner: userId }).skip(skip).limit(limit)

    return res.status(200)
        .json(new ApiResponse(200, { videos, totalPage }, "All videos fetched succesfully"))

})

const updateViews = asyncHandler(async(req, res)=>{
    const {videoId}=req.params; 
    if(!isValidObjectId(videoId)){
        throw new ApiError(401, "video does not exist")
    }

    const increment = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: {
                view: 1
            }
        }, {new: true}
    )
        if(!increment){
            throw new ApiError(404, "server error")
        }
       

       return res.status(200)
        .json(new ApiResponse(200, {views:increment.view }, "number of views incremented"))
})

const uploadVideo = asyncHandler(async(req, res)=>{
    const {title, description} = req.body;
    if(!title || !description){ 
        throw new ApiError(401, "Title and description are required")
    }
    const videoPath = req.files?.videoFile?.[0].path 
    const thumbnailPath = req.files?.thumbnail?.[0].path

    if(!videoPath || !thumbnailPath){
        throw new ApiError(401, "File path are required")
    }

    const uploadedVideoFile = await uploadOnCloudinary(videoPath)
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath)

    if(!uploadedVideoFile?.url || !uploadedThumbnail?.url){
        throw new ApiError(500, "error while uploading files on server")
    }

    const video = await Video.create({
        videoFile: uploadedVideoFile?.url,  
        thumbnail: uploadedThumbnail?.url,
        title,
        description,
        duration: uploadedVideoFile?.duration, 
        owner: req.user?._id,
        isPublished: true
    })

    const createdVideo = await Video.findById(video._id)
    
    if(!createdVideo){
        throw new ApiError(500, "server error")
    }
    return res.status(200)
    .json(new ApiResponse(200, {video: createdVideo}, "Video uploaded succesfully"))

})


const updateThumbnail = asyncHandler(async(req, res)=>{
    const {videoId}= req.params;

    const replaceThumbnailPath = req.files?.thumbnail?.[0].path;
    if(!replaceThumbnailPath){
        throw new ApiError(401, "path is not entered properly")
    }
    //find the video data using the id 
    const video = await Video.findById(videoId)
    //take the url of the image which is present already
    const imageUrlToBeDeleted =video.url  

    //delete the image from cloudinary 
    const result = deleteImageFromCloudinary(imageUrlToBeDeleted)

    if(!result){
        throw new ApiError(402, "could not delete from server")
    }
    console.log("Previous thumbnail deleted");
    
    const replaceThumbnail = await uploadOnCloudinary(replaceThumbnailPath)

    if(!replaceThumbnail?.url){
        throw new ApiError(402, "Error while uploading on server")
    }

    video.thumbnail= replaceThumbnail.url;
    await video.save();
   console.log("thumbnail updated");
   
    
   return res.status(200)
    .json(new ApiResponse(200, {video: video}, "thumbnail updated"))
}) 


const updateVideo = asyncHandler(async(req, res)=>{
    const {title, description, isPublished}= req.body 
    const {videoId} = req.params ; 
    
    if([title, description, isPublished].some((e)=> e?.trim()==="")){
        throw new ApiError(401, "title | description | isPublic are required")
    }

    const updatedvideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                isPublished
            }
         },
         {new: true}
    )

    if(!updatedvideo){
        throw new ApiError(500, "server error")
    }

    res.status(200)
    .json(new ApiResponse(200, {video: updatedvideo}, "update succesfull"))
})


const deleteVideo = asyncHandler(async(req, res)=>{
    const {videoId}=req.params ;
    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "Invalid video ID")
    }

    const deleted = await Video.findByIdAndDelete(videoId)

    if(!deleted){ 
        throw new ApiError(500, "video not found on server")
    }

    const urlVideoOfVideoToDelete = deleted.videoFile
    const urlThumbnailOfVideoToDelete= deleted.thumbnail

    const deleteVideo = await deleteVideoFromCloudinary(urlVideoOfVideoToDelete)
    const deleteImage = await deleteImageFromCloudinary(urlThumbnailOfVideoToDelete)
    if(!deleteImage || !deleteVideo){
        throw new ApiError(501, "Server error cloudinary")
    }

    res.status(200)
    .json(200, deleted.title, "video deleted")
})



export { 
    getAllVideos,
     uploadVideo,
      deleteVideo, 
      updateViews,
      updateThumbnail
    }