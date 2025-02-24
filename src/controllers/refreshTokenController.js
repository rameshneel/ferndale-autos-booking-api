// refreshTokenController.js
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const refreshToken = asyncHandler(async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    console.log("refresh toknn", refreshToken);

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log("decodedhg", decoded);

    // Find the user by id
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" } // Access token expires in 15 minutes
    );

    // Set the new access token in a cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true, // Use secure in production
      sameSite: "None",
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });

    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.error("Error in refreshToken:", error);
    res.status(403).json({ message: "Invalid refresh token" });
  }
});
export const apiProtect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    res.status(200).json({
      authenticated: true,
      message: "User authenticated successfully",
    });
  } catch (error) {
    next(error);
  }
});
