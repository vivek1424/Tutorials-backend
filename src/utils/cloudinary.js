import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET  // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null 
        //upload the file on cloudinary 
        const response= await cloudinary.uploader.upload(localFilePath, { 
            resource_type: "auto"
        })
        //file has been uploaded succesfully
       // console.log("File is uploaded on cloudinary", response.url);
       fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temp file as upload operation failed 
        return null;
    }
}

const deleteImageFromCloudinary = async(publicId )=>{
    try {
        if(!publicId){
            return null
        }
        const result = await cloudinary.uploader.destroy( publicId, {
            resource_type: "image"
        })
        console.log(result);
        return result;

    } catch (error) {
        console.log("an error has occured while deleting");
        return error
    }
}

const deleteVideoFromCloudinary = async(publicId )=>{
    try {
        if(!publicId){
            return null
        }
        const result = await cloudinary.uploader.destroy( publicId, {
            resource_type: "video"
        })
        console.log(result);
        return result;

    } catch (error) {
        console.log("an error has occured while deleting");
        return error
    }
}


export {uploadOnCloudinary, deleteImageFromCloudinary, deleteVideoFromCloudinary} 

