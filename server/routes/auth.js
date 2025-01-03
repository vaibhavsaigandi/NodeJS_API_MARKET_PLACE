import express from "express";
import {
  api,
  login,
  forgotPassword,
  currentUser,
  updatePassword,
  updateUsername,
  updateProfile,
} from "../controllers/auth.js";
import { requireSignin } from "../middlewares/auth.js";
const router = express.Router();

router.get("/", requireSignin, api);

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/current-user", requireSignin, currentUser);
router.put("/update-password", requireSignin, updatePassword);
router.put("/update-username", requireSignin, updateUsername);
router.put("/update-profile", requireSignin, updateProfile);
//some routes are only accessible by logged in users such as updating the password, updating the profile, etc.
//we need to create a a middleware to check if the user is logged in or not using the token in the header.
//update password

export default router;
