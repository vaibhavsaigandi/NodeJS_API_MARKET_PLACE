import mongoose from "mongoose";

const { Schema, ObjectId, model } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    address: {
      type: String, // Fixed typo
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 64,
    },
    role: {
      type: [String],
      default: ["Buyer"],
      enum: ["Buyer", "Seller", "Admin", "Author"], // Only these roles are allowed
    },
    photo: {}, // No schema defined, assuming free-form object
    logo: {}, // No schema defined, assuming free-form object
    company: {
      type: String,
      default: "", // Company name
    },
    enquiredProperties: [{ type: ObjectId, ref: "Ad" }], // Array of property IDs
    whilist: [{ type: ObjectId, ref: "Ad" }], // Array of IDs for wishlist
    about: {
      type: String,
      default: "", // User description
    },
  },
  { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

export default model("User", userSchema);
