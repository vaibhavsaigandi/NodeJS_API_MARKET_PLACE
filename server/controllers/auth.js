import { sendWelcomeEmail, sendResetPasswordEmail } from "../helpers/email.js";
import validator from "email-validator";
import User from "../models/user.js";
import { hashPassword, comparePassword } from "../helpers/auth.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
export const api = (req, res) => {
  res.send(`The Current time is ${new Date().toLocaleTimeString()}`);
  // res.json({
  //   user: req.user,
  // });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  //using npm express-validator to validate the email and password
  if (!validator.validate(email)) {
    return res.json({ message: "Invalid email , a valid email is required" });
  }
  if (!email?.trim()) {
    return res.json({ message: "Email is required" }); //trim() is used to remove leading and trailing spaces
  }
  if (!password?.trim()) {
    return res.json({ message: "Password is required" });
  } //trim() is used to remove leading and trailing spaces
  if (password.length < 6) {
    return res.json({ message: "Password must be atleast 6 characters long" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      //create a user if he is not found in the database
      try {
        console.log("Sending welcome email...");
        await sendWelcomeEmail(email);
        console.log("Creating user...");
        const createduser = await User.create({
          email,
          password: await hashPassword(password),
          username: nanoid(6),
        });
        console.log("Generating token...");
        const token = jwt.sign(
          { _id: createduser._id },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );
        createduser.password = undefined;
        console.log("User created successfully");
      } catch (err) {
        console.error("Error during user creation:", err);
        return res.json({
          error: "Invalid email.Please use a valid email address,",
        });
      }
    } else {
      //compare the password with the hashed password and login the user..
      const match = await comparePassword(password, user.password);
      if (!match) {
        return res.json({ message: "Wrong password please try agian" });
      } else {
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });
        user.password = undefined;
        res.json({ user, token });
      }
    }
  } catch (err) {
    console.log("login error", err);
    res.json({
      error: "Something went wrong. Try agian",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body; //get the email from the request body
    let user = await User.findOne({ email }); //find the user with the email
    if (!user) {
      return res.json({
        error:
          "If we find your account , you will recive an email form us shortly.",
      }); //if the user does not exist return an error message
    } else {
      const password = nanoid(6); // if user forgets the password , generate a random password
      user.password = await hashPassword(password); //hash the password
      await user.save(); //save the password in the database

      //send email
      try {
        //send email
        await sendResetPasswordEmail(email, password);
        return res.json({
          message: "Password reset email has been sent to your email address",
        });
      } catch (err) {
        console.log("Error sending password reset email =>", err);

        return res.json({ error: "Error sending password reset email" });
      }
    }
  } catch (err) {
    console.log("forgot password error", err);
    res.json({
      error: "Something went wrong. Try agian",
    });
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.password = undefined;
    res.json({ user });
  } catch (err) {
    console.log("currentUser error", err);
    res.json({ error: "Something went wrong. Try agian" }); //return an error message if something goes wrong while fetching the user
  }
};

export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); //find the user by the id
    let { password } = req.body; //get the password from the request body
    //trim the password

    password = password ? password.trim() : ""; //if password is present trim it else set it to an empty string

    if (!password) {
      //this checks if the password is empty if its empty return an error message
      return res.json({ error: "Password is required" });
    }

    if (password.length < 6) {
      return res.json({ error: "Password must be atleast 6 characters long" });
    }

    const hashedPassword = await hashPassword(password); //hash the password
    user.password = hashedPassword; //set the password to the hashed password
    await user.save(); //save the user
    res.json({ ok: true });
  } catch (err) {
    console.log("updatePassword error", err);
    res.json({ error: "Something went wrong. Try agian  " });
  }
};

export const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Username is required" });
    }
    const trimmedUsername = username.trim();
    // Check if the username is already taken by another user
    const existingUser = await User.findOne({
      username: trimmedUsername,
    });
    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken" });
    }
    // Update user document in the database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { username: trimmedUsername },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "Update failed. Try again." });
    }
    // Remove sensitive information from the response
    updatedUser.password = undefined;
    updatedUser.resetCode = undefined;
    // Send the updated user object as the response
    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      // MongoDB duplicate key error code
      return res.status(400).json({ error: "Username is already taken" });
    } else {
      return res
        .status(500)
        .json({ error: "An error occurred while updating the profile" });
    }
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, company, address, about, photo, logo } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (phone) updateFields.phone = phone.trim();
    if (company) updateFields.company = company.trim();
    if (address) updateFields.address = address.trim();
    if (about) updateFields.about = about.trim();
    if (photo) updateFields.photo = photo;
    if (logo) updateFields.logo = logo;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    updatedUser.password = undefined;
    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Server error" });
  }
};
