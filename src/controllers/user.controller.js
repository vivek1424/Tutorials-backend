import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import { response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

//no asynchandler needed because this is not a web request 
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    //take the refresh token and save it in the user object
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })  //dont validate before saving, because it will again ask for pw 
    //since the mongoose will kick in, hence dont validate now


    //returning the tokens, since the method is designed exactly for that 
    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating the tokens")
  }

}

const registerUser = asyncHandler(async (req, res) => {
  //take the input from the user -from the frontend 
  //validation - not empty 
  //check if the user already exists - ( using the email and username)
  //check for images, check for avatar 
  //upload them to cloudinary 
  //create user object - create entry in db 
  //remove pw and refresh token field from response 
  //check for user creation 

  //making the object, taking data from the user 
  //data can be taken, not the files , hence for avatar and cover image diverted to routes 
  const { fullName, email, username, password } = req.body
  //  console.log("email:", email);

  //below code is for validation 
  //even after the trim, if the field is empty - even if one of them is empty, then some will stop and return true
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are compulsory")
  }

  //check if there already exists a user with the given username or email 
  const existedUser = await User.findOne({
    $or: [{ username }, { email }] //this is used to check using the multiple values 
  })


  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;   //this gives the local path of the avatar 
  //  const coverImageLocalPath =req.files?.coverImage[0]?.path; //this gives the local server path of the cover image 

  //here check if the file is given and then that file contains coverImage and is not empty
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }

  //now use the uploadOnCloudinary 
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })
  const createdUser = await User.findById(user._id).select("-password -refreshToken")  //try to find if there is user created 
  // "-password" this indicates that the password is not to be selected

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered succesfully")
  )

})


const loginUser = asyncHandler(async (req, res) => {
  // my algo -check whether the user credentials already present 
  // if the credentials present, give them the token and grant the acccess 
  //if credentials not present, give them the option to register

  //hitesh algo - data from the request body 
  // username or email ( give access on anyone )
  //find the user in the database 
  // password check  
  //access and refresh tokens to be generated and given to user 
  //send cookies 

  //take the data from the req body 

  const { email, username, password } = req.body

  //either of username or email is required 
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required")
  }

  //if we want either of the email or username to work, then 
  // if(!(username || email)) - this is to be used 
  const user = await User.findOne({
    //find a value either on the base of username or the email
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new ApiError(404, "User does not exist")
  }

  //if there is the user available 
  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
  }

  //give the access and refresh token 
  //access the method 
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

  const loggedInUSer = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200).cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUSer, accessToken, refreshToken
        },
        "User logged in succesfully"
      )
    )


})


const logoutUser = asyncHandler(async (req, res) => {
  //clear the cookies 
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1 //this removes field from the document 
      }
    },
    {
      new: true
    }
  )
  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200).clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out succesfully"))

})


const refreshAcessToken = asyncHandler(async (req, res) => {
  //access the referesh token from cookies 
  //we also have a refresh token inside database 
  //we need this one for again letting the session start 
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request") //since token is incorrect 
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id) // check if we get any user by the id we get from the
    //decoded token that is recieved 

    if (!user) {
      throw new ApiError(401, "Invalid refresh token") //since token is incorrect 
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used")
    }

    const options = {
      httpOnly: true,  //done to prevent the access to cookies through the client side
      secure: true //transmitted over https secure, encrypted server 
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )


      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token ")
  }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  //checking from the middleware when the user is logged in , that means we do have user with us 
  const user = await User.findById(req.user?._id)
  //check if the entered old password is correct 
  const isEnteredPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isEnteredPasswordCorrect) {
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed succesfully "))
})


const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched succesfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, } = req.body

  if (!(fullName || email)) {
    throw new ApiError(400, "All fields are required")
  }

  //since new one will be returned since new is true 
  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        fullName,
        email,

      }
    },
    { new: true } //this ensures that new information is stored
  ).select("-password")

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated succesfully"))

})


const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar")
  }

  const user =await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    { new: true }
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "Avatar updated succesfully")
  )

})


const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path  //take the file from the user 

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)   //upload that on cloudinary and get url

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover image")
  }

  const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url      //update the coverImage of user with the new url 
      }
    },
    { new: true }
  ).select("-password")


  //send response eventually 
  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "Cover Image updated succesfully")
  )

})


const guestUserChannelProfile = asyncHandler( async( req, res)=>{
    const { username} = req.params  //for getting a channel's profile we go to the url of the channel
    //get the username from the url using the params  

    if (!username?.trim()) {
       throw new ApiError(400, "username is missing")
    }
    //we reach here when we have username 
    //now using the aggregation pipeline 

    //aggregate takes the array and in it there are pipelines
    //aggregate function returns the array 
    const channel =await User.aggregate([
      {
        //first pipeline 
        //filters only that document which matches the condition
        $match:{
          username: username?.toLowerCase()
        }
      },
      {
        //find the number of subscribers of the channel
        $lookup: {
          from: "subscriptions", //in the model names convert into lowercase and turn plural 
          localField: "_id", //what is the value needed from the user model 
          foreignField: "channel",  //this value is present in the subscription user model whichis (_id) in user
          as: "subscribers"
        }, 

      },

      {
        //this will give the channels user has subscribed to, since this user will be present as subscriber 
        //in the subscription model
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",  //
          as: "subscribedTo"
        }
      },

      //third pipeline
      {
        //this will add the additonal fields
        $addFields:{
          subscribersCount:{
            $size: "$subscribers" //name in the first lookup 
          },
          channelsSubscribedToCount : { 
            $size: "$subscribedTo" //name in the second lookup
          },
          //subscription button
          isSubscribed :{
            $cond: {
              if:{ $in: [req.user?._id, "$subscribers.subscriber"]},
              then: true,
              else: false
            }
          }
        }
      },
      {
        //gives out  the selective values using 1-0 flag
        $project: {
          fullName: 1,
          username: 1,
          subscribersCount:1, 
          channelsSubscribedToCount:1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1 
        }
      }
    ])
    if (!channel?.length) {
      throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse( 200, channel[0], "User channel fetched succesfully"))


})


const getWatchHistory = asyncHandler(async(req, res)=>{
   // req.user._id - this gives you the string 
   const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }

    },
    {
      $lookup:{
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        //nested lookup, since we need user data too, which is owner of video
        pipeline: [
          {
            $lookup:{
              from: "users",
              localField:"owner",
              foreignField:"_id",
              as: "owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username: 1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
   ])
   
   return res
   .status(200)
   .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "Watch history fetched succesfully"
    )
   )
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAcessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  guestUserChannelProfile,
  getWatchHistory
}




