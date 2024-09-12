import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";


const createPlaylist = asyncHandler(async (req, res) => {

    const { name, description } = req.body;
    if (!name || !description) {
        throw new ApiError(402, "name and description are missing")
    }

    const createdPlaylist = await Playlist.create({
        name: name,
        description: description,
        owner: req.user?._id
    })

    if (!createdPlaylist) {
        throw new ApiError(402, "Server error")
    }

    return res.status(200)
        .json(new ApiResponse(200, { playlist: createdPlaylist }, "Playlist created"))

})

const addToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid video")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid playlist")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(402, "Video not found")
    }

    const playListToUpdate = await Playlist.findById(playlistId)
    if (!playListToUpdate) {
        throw new ApiError(401, "Playlist not found")
    }

    if (playListToUpdate?.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(501, "Only owner can add to playlist")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        }, { new: true }

    )

    if (!updatedPlaylist) {
        throw new ApiError(502, "Video could not be added to playlist")
    }
    return res.status(200)
        .json(new ApiResponse(200, { playlist: updatedPlaylist }, "Video added to playlist"))

})


const getUserPlaylist = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(401, "Invalid playlist")

    }
    const userplaylist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    if (!userplaylist) {
        throw new ApiError(501, "Server error")
    }
    return res.status(200)
        .json(new ApiResponse(200, { playlist: userplaylist }, "this is the user's playlist"))
})


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid video")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid playlist")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(402, "Video not found")
    }

    const playListToUpdate = await Playlist.findById(playlistId)
    if (!playListToUpdate) {
        throw new ApiError(401, "Playlist not found")
    }

    if (playListToUpdate?.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(501, "Only owner can add to playlist")
    }

    const deletevideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        }, { new: true }
    )

    if (!deletevideo) {
        throw new ApiError(501, "Server error")
    }
    return res.status(200)
        .json(new ApiResponse(200, { deletedPlaylist: deletevideo }, "Video has been removed from the playlist"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "playlist does not exist")
    }
    const { name, description } = req.body;
    if (!name || !description) {
        throw new ApiError(402, "name and description are missing")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name,
                description: description
            }
        }, { new: true }
    )

    if (!updatedPlaylist) {
        throw new ApiError(402, "Server error")
    }

    return res.status(200)
        .json(new ApiResponse(200, { playlist: updatedPlaylist }, "Playlist created"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(401, "playlist does not exist")
    }
    
    const playListToDelete = await Playlist.findById(playlistId)

    if (playListToDelete?.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(501, "Only owner can delete the playlist")
    }


    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)

    if (!deletePlaylist) {
        throw new ApiError(402, "Server error")
    }

    return res.status(200)
        .json(new ApiResponse(200, { deletedPlaylist: deletePlaylist}, "Playlist deleted"))

})

export { createPlaylist, addToPlaylist, getUserPlaylist, removeVideoFromPlaylist, updatePlaylist, deletePlaylist }