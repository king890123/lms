
import User from "../models/User.js";
import Course from "../models/Course.js";
import Stripe from "stripe";
import {CourseProgress} from "../models/CourseProgress.js";

//get user data
 export const getUserData = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

//user enrolled courses with lecture links
export const userEnrolledCourses = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const userData = await User.findById(userId).populate('enrolledCourses');      
       res.json({ success: true, enrolledCourses: userData.enrolledCourses });
    } catch (error) {
        res.json({ success: false, message: error.message });
    
};
}

//purchase course
export const purchaseCourse = async (req, res) => {
     try {
        const {courseId} = req.body;
        const userId = req.auth.userId;
        const {origin} = req.headers;
        const userData = await User.findById(userId);
        const courseData = await Course.findById(courseId);
        if (!userData || !courseData) {
            return res.json({ success: false, message: 'Data not found' });
        }
        // Implement payment processing logic here
        const purchaseData = {
          courseId: courseData._id,
          userId,
          amount : (courseData.price - courseData.discount * courseData.price / 100).toFixed(2),

        }
        const newPurchase = await Purchase.create(purchaseData);

        //stripe gateway initialization
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
             const currency = process.env.CURRENCY;
        ;//create line items for stripe
        const line_items = [
            {
                price_data: {
                    currency,
                    product_data: {
                        name: courseData.courseTitle,
                        description: courseData.description,
                    },
                    unit_amount: Math.floor(newPurchase.amount * 100),
                },
                quantity: 1,
            },
        ];
        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            metadata: {
                 purchaseCourseId: newPurchase._id.toString(),
            }
        });

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

//update user course progress
export const updateUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId, lectureId } = req.body;
        const progressData = await CourseProgress.findOne({ userId, courseId });
        if(progressData){
            if(progressData.lectureCompleted.includes(lectureId)){
                return res.json({ success: false, message: 'Lecture already completed' });
            }
            progressData.lectureCompleted.push(lectureId);
            await progressData.save();
        }
        else{
            const newProgress = await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId],
            });
        }
        res.json({ success: true, message: 'progress updated' });
    } catch (error) {
        res.json({ success: false, message: error.message });
        
    }
}

//get user course progress
export const getUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId } = req.body;
        const progressData = await CourseProgress.findOne({ userId, courseId });
        res.json({ success: true, progressData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

//add user rating to course
export const addUserRating = async (req, res) => {
    
        const userId = req.auth.userId;
        const { courseId, rating } = req.body;
         if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
            return res.json({ success: false, message: 'Invalid data' });
        }
    try {
        const course= await Course.findById(courseId);
        if (!course) {
            return res.json({ success: false, message: 'Course not found' });
        }
        const user= await User.findById(userId);
        if(!user || !user.enrolledCourses.includes(courseId)){
            return res.json({ success: false, message: 'User not enrolled in the course' });
        }
        const existingRatingIndex= course.ratings.findIndex((rating) => rating.userId.toString() === userId);
        if (existingRatingIndex > -1) {
            course.ratings[existingRatingIndex].rating = rating;
        } else {
            course.ratings.push({ userId, rating });
        }
        await course.save();
        res.json({ success: true, message: 'Rating added' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}