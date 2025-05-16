import {v2 as cloudinary} from 'cloudinary';    
import Course from "../models/Course.js";
import { clerkClient } from "@clerk/express";
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
//update roll to educator
export const updateRollToEducator = async (req,res)=>{
    try {
        const userId = req.auth.userId;
        await clerkClient.users.updateUserMetaData(userId,{
            publicMetadata:{
                role:'educator'
            }
        })
        res.json({success:true},{message:"You can now create courses"})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

//add new course
export const addCourse = async (req,res)=>{
    try {
         const {courseData} = req.body;
         const imageFile = req.file;
         const educatorId = req.auth.userId;
         if(!imageFile){
            return res.json({success:false,message:"Please upload course image"})
         }
         const parsedCourseData = JSON.parse(courseData);
         parsedCourseData.educator = educatorId;
        const newCourse = await Course.create(parsedCourseData);
       const imageUpload= await cloudinary.uploader.upload(imageFile.path)
       newCourse.courseThumbnail = imageUpload.secure_url;
       await newCourse.save();
       res.json({success:true,message:"Course created successfully"})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

//get educator courses
export const getEducatorCourses = async (req,res)=>{
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({educator});
        res.json({success:true,courses})
    } catch (error) {   
        res.json({success:false,message:error.message})
    }
}

//get educator dashboard data (courses,students,revenue)
export const educatorDashboardData = async (req,res)=>{
    try{
        const educator = req.auth.userId;
        const courses = await Course.find({educator});
        const courseIds = courses.map((course)=>course._id);
        //calculate revenue
        const purchases = await Purchase.find({courseId:{$in:courseIds},status:'completed'});
        const totalEarnings = purchases.reduce((sum,purchase)=>sum+purchase.amount,0);
        //collect unique enrolled students IDs with their course titles
        const enrolledStudentsData = [];
        for (const course of courses) {
            const purchases = await Purchase.find({courseId:course._id,status:'completed'});
            for (const purchase of purchases) {
                const students = await User.find({
                    _id: {$in: course.enrolledStudents},
                },'name imageUrl');
                students.forEach((student)=>{
                    enrolledStudentsData.push({
                        courseTitle:course.courseTitle,
                        student
                    });
                });
            }
        }
        res.json({success:true,dashboardData:{
            totalCourses: courses.length,
            totalEarnings,
            enrolledStudentsData
        }});
    } catch (error) {        res.json({success:false,message:error.message})
    }
}

//get enrolled students data with purchase data
export const getEnrolledStudentsData = async (req,res)=>{
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({educator});
        const courseIds = courses.map((course)=>course._id);
        const purchases = await Purchase.find({courseId:{$in:courseIds},status:'completed'}).populate('userId','name imageUrl').populate('courseId','courseTitle');
        const enrolledStudents = purchases.map(purchase => ({
             student: purchase.userId,
             courseTitle: purchase.courseId.courseTitle,
             purchaseDate: purchase.createdAt,
        }));   
        res.json({success:true,enrolledStudents})
     } catch (error) {
        res.json({success:false,message:error.message})
    }
}
