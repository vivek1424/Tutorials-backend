import multer from "multer";

//we are using disk storage 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp1")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
 export const upload = multer({ storage,})