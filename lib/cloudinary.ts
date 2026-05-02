import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzhhffo2b',
  api_key: process.env.CLOUDINARY_API_KEY || '812876227263417',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'txNkl1mh8nNiPf-GXePNmRabAR4'
})

export default cloudinary
