import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createAppError } from "../utils/createAppError.js";

// Public signup leaves the admin role unset so the User schema defaults it to false.
export const register = async (name, email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createAppError('User already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const { password: _, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};

export const login = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw createAppError("Invalid email or password", 400);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createAppError("Invalid email or password", 400);
  }

  const token = jwt.sign(
    {
      id: user._id,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRATION,
    }
  );

  return { token, userId: user._id, name: user.name };
};