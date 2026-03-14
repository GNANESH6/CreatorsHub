import Review from "../models/Review.js";
import Collaboration from "../models/Collaboration.js";

// Add a review (only allowed if they have an accepted collaboration)
export const addReview = async (req, res) => {
  try {
    const { revieweeId, rating, comment } = req.body;
    const reviewerId = req.user;

    if (reviewerId.toString() === revieweeId) {
      return res.status(400).json({ message: "You cannot review yourself." });
    }

    // Check if they have an accepted collaboration
    const collab = await Collaboration.findOne({
      $or: [
        { sender: reviewerId, receiver: revieweeId, status: "accepted" },
        { sender: revieweeId, receiver: reviewerId, status: "accepted" }
      ]
    });

    if (!collab) {
      return res.status(403).json({ message: "You can only review users you have collaborated with." });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ reviewerId, revieweeId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this user." });
    }

    const review = await Review.create({
      reviewerId,
      revieweeId,
      rating,
      comment
    });

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add review" });
  }
};

// Get all reviews for a specific user
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ revieweeId: userId })
      .populate("reviewerId", "name profileImage occupation")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};
