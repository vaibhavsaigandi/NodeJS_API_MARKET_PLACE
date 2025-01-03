import express from "express";
import * as ad from "../controllers/ad.js";
import { requireSignin } from "../middlewares/auth.js";
import multer from "multer"; // for handling multipart/form-data (file uploads)
import { isAdmin } from "../middlewares/auth.js";
const router = express.Router(); // create a new router object
const upload = multer({ storage: multer.memoryStorage() }); // store the file in memory as a Buffer object

router.post("/upload-image", requireSignin, upload.any(), ad.uploadImage); // upload image to cloudinary and save the url to the database
router.delete("/remove-image", requireSignin, ad.removeImage); // remove image from cloudinary and the database
router.post("/create-ad", requireSignin, ad.createAd); // create a new ad
router.get("/ad/:slug", ad.read); // get a single ad
router.get("/ads-for-sell/:page", ad.adsForSell); // get all ads for sell
router.get("/ads-for-rent/:page", ad.adsForRent); // get all ads for rent
router.put("/update-ad/:slug", ad.updateAd); // update an ad
router.delete("/delete-ad/:slug", ad.deleteAd); // delete an ad
router.get("/user-ads/:page", requireSignin, ad.userAds); // get all ads created by a user
router.put("/update-ad-status/:slug", requireSignin, ad.updateAdStatus); // update the status of an ad
router.post("/contact-agent", requireSignin, ad.contactAgent); // send an email to the agent of an ad
router.get("/enquired-ads/:page", requireSignin, ad.enquiredAds);
router.put("/toggle-wishlist/:adId", requireSignin, ad.toggleWishlist);
router.get("/wishlist/:page", requireSignin, ad.userWishlist);
router.post("/search-ads", ad.searchAds);
router.put(
  "/toggle-published/:adId",
  requireSignin,
  isAdmin,
  ad.toggleWishlist
);
export default router; // export the router object to be used in index.js
