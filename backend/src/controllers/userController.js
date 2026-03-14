import mongoose from "mongoose";
import User from "../models/User.js";

/*
================================================
UPDATE PROFILE (SAFE VERSION)
================================================
*/

export const updateProfile = async (req, res) => {

  try {

    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const {
      name,
      occupation,
      skills,
      bio,
      profileImage,
      locationName,
      location
    } = req.body;

    // Update fields if provided
    if (name) user.name = name;
    if (occupation) user.occupation = occupation;
    if (skills) user.skills = skills;
    if (bio) user.bio = bio;
    if (profileImage) user.profileImage = profileImage;
    if (locationName) user.locationName = locationName;
    if (location) user.location = location;

    /*
    =====================================
    CHECK PROFILE COMPLETION
    =====================================
    */

    if (
      user.occupation &&
      user.bio &&
      user.profileImage &&
      user.locationName &&
      user.location &&
      user.location.coordinates &&
      user.location.coordinates.length === 2
    ) {
      user.isProfileComplete = true;
    }

    await user.save();

    res.json({
      message: "Profile updated",
      isProfileComplete: user.isProfileComplete
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Profile update failed"
    });

  }

};

/*
================================================
SEARCH USERS (ONLY COMPLETE PROFILES)
================================================
*/

export const searchUsers = async (req, res) => {

  try {

    const {
      q,
      lng,
      lat,
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const pipeline = [];

    /*
    =====================================
    GEO SEARCH (FIRST STAGE)
    =====================================
    */

    if (lng && lat) {

      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          distanceField: "distance",
          spherical: true,
          query: {
            _id: { $ne: new mongoose.Types.ObjectId(req.user) },
            isProfileComplete: true
          }
        }
      });

    } else {

      pipeline.push({
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(req.user) },
          isProfileComplete: true
        }
      });

    }

    /*
    =====================================
    MULTI WORD SEARCH
    =====================================
    */

    if (q) {

      const words = q.trim().split(" ");
      const regexArray = words.map(word => new RegExp(word, "i"));

      pipeline.push({
        $match: {
          $or: [
            { name: { $in: regexArray } },
            { occupation: { $in: regexArray } },
            { locationName: { $in: regexArray } },
            { skills: { $in: regexArray } }
          ]
        }
      });

    }

    /*
    =====================================
    SORT
    =====================================
    */

    pipeline.push({
      $sort: {
        distance: 1,
        createdAt: -1
      }
    });

    /*
    =====================================
    PAGINATION
    =====================================
    */

    pipeline.push({ $skip: (pageNum - 1) * limitNum });
    pipeline.push({ $limit: limitNum });

    /*
    =====================================
    REMOVE PASSWORD
    =====================================
    */

    pipeline.push({
      $project: {
        password: 0
      }
    });

    const users = await User.aggregate(pipeline);

    res.json(users);

  } catch (err) {

    console.error("Search Error:", err);

    res.status(500).json({
      message: "Search failed"
    });

  }

};

export const subscribePush = async (req, res) => {
  try {
    const { subscription } = req.body;
    await User.findByIdAndUpdate(req.user, { pushSubscription: subscription });
    res.json({ message: "Subscribed to push notifications" });
  } catch (err) {
    console.error("Push subscribe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVapidKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};
