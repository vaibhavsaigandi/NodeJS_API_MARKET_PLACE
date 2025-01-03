import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import sharp from "sharp";

const client = new S3Client({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
});
const resizedImage = async (buffer) => {
  //resize the image
  return sharp(buffer)
    .resize(1600, 900, { fit: "inside", withoutEnlargement: true })
    .toBuffer(); //resize the image to 1600x900 and return the buffer
};

const uploadTos3 = async (buffer, mimetype, uploadedBy) => {
  const metadata = await sharp(buffer).metadata(); //get the metadata of the image
  const fileExtension = mimetype.format || "jpg"; //get the file extension

  const Key = `${nanoid()}.${fileExtension}`; //generate a unique key for the image
  const Location = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonws.com/${Key}`; //generate the location of the image
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key,
    Body: buffer,
    ContentType: mimetype,
  };
  try {
    const command = new PutObjectCommand(params); // Correct Command

    await client.send(command);
    return { Key, Location, uploadedBy }; //return the key, location and uploadedBy
  } catch (err) {
    console.log("upload to s3 error", err);
    throw err;
  }
};

export const uploadImageToS3 = async (files, uploadedBy) => {
  //map thorugh
  const uploadPromises = files.map(async (file) => {
    //map through the files array  and return a promise
    //resize
    const resizedBuffer = await resizedImage(file.buffer); //resize the image
    //upload
    return uploadTos3(resizedBuffer, file.mimetype, uploadedBy); //upload the image to s3
  });
  return Promise.all(uploadPromises); //return the promise
};

export const deleteImageFromS3 = async (Key) => {
  //delete image from s3
  const params = {
    //set the parameters
    Bucket: process.env.AWS_BUCKET_NAME,
    Key,
  };
  try {
    const command = new DeleteObjectCommand(params); // command to delete the object
    await client.send(command);
  } catch (err) {
    console.log("delete from s3 error", err);
    throw new Error("Error deleting image from S3");
  }
};
