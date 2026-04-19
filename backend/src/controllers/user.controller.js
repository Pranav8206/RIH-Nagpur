import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createError } from "../utils/CreateError.js";

const generateToken = (userId) => {
  return jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// REGISTER
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
console.log("register called");


  if (!email || !password) {
    throw createError("Email and password are required", 400);
  }

  if (password.length < 8) {
    throw createError("Password must be at least 8 characters", 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw createError("User already exists", 400);
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password,
  });
console.log("register called 2");

  const token = generateToken(user._id);

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic,
      },
    },
  });
});

// LOGIN
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError("Email and password are required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw createError("User not found", 400);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw createError("Invalid credentials", 400);
  }

  const token = generateToken(user._id);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        profilePic: user.profilePic,
      },
    },
  });
});

// GET CURRENT USER
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
});

// GET USER BY ID
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select("-password");

  if (!user) {
    throw createError("User not found", 404);
  }

  return res.status(200).json({
    success: true,
    data: user,
  });
});

// UPDATE PROFILE
const updateCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw createError("Not authorized", 401);
  }

  const { fullName, email, profilePic } = req.body;
  const updates = {};

  if (fullName) updates.fullName = fullName.trim();
  if (profilePic) updates.profilePic = profilePic.trim();

  if (email) {
    const normalizedEmail = email.toLowerCase();

    const existing = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: userId },
    });

    if (existing) {
      throw createError("Email already in use", 400);
    }

    updates.email = normalizedEmail;
  }

  if (!Object.keys(updates).length) {
    throw createError("No valid fields to update", 400);
  }

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
  }).select("-password");

  return res.status(200).json({
    success: true,
    message: "Profile updated",
    data: user,
  });
});

// CHANGE PASSWORD
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw createError("Both passwords required", 400);
  }

  if (newPassword.length < 8) {
    throw createError("Password must be at least 8 characters", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw createError("User not found", 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw createError("Current password incorrect", 400);
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password updated",
  });
});

// DELETE ACCOUNT
const deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user._id);

  return res.status(200).json({
    success: true,
    message: "Account deleted",
  });
});

// LOGOUT (stateless)
const logoutUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

export {
  registerUser,
  loginUser,
  getCurrentUser,
  getUserById,
  updateCurrentUser,
  changePassword,
  deleteAccount,
  logoutUser,
};
