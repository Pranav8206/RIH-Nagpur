import mongoose, { model, Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    profilePic: {
      type: String,
      // default: "https://res.cloudinary.com/dfxpccwii/image/upload/v1775238717/depositphotos_137014128-stock-illustration-user-profile-icon_idkmhn.webp",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },

  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  // return next();
});

export const User = model("User", userSchema);
