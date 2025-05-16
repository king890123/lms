import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
    lectureTitle: {
        type: String,
        required: true
    },
    lectureDescription: {
        type: String,
        required: true
    },
    lectureId:{
        type: String,
        required: true
    },
    lectureDuration: {
        type: Number,
        required: true
    },
    lectureUrl: {
        type: String,
        required: true
    },
    isPreview: {
        type: Boolean,
        default: false
    },
    length: {
        type: Number,
        required: true
    },
},{
    _id: false,
});

const chapterSchema = new mongoose.Schema({
    chapterTitle: {
        type: String,
        required: true
    },
    chapterId:{
        type: String,
        required: true
    },
    chapterOrder:{
        type: Number,
        required: true
    },
    chapterContent: [lectureSchema],
},{
    _id: false,
});

const courseSchema = new mongoose.Schema({
    courseTitle: {
        type: String,
        required: true
    },
    courseDescription: {
        type: String,
        required: true
    },
    courseUrl: {
        type: String,
        required: true
    },
    coursePrice: {
        type: Number,
        required: true
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    discount: {
        type: Number,
         required: true,
         min:0,
         max:100
    },
    courseContent:[chapterSchema],
    courseRatings:[{
        userId:{
            type:String,
        },
        rating:{
            type:Number,
            min:1,
            max:5
        }
    }],
    educator:{
        type:String,
        required:true,
        ref:'User'
    },
    enrolledStudents:[{
        type:String,
        ref:'User'
    }],
    },
     {
        timestamps:true,
        minimize: false,
    });

const Course = mongoose.model("Course", courseSchema);

export default Course;