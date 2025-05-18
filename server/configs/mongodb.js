import mongoose from "mongoose";

// Connect to MongoDB
const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected');
        });
        
        // Properly format the connection string
        const uri = process.env.MONGODB_URI.endsWith('/') 
            ? `${process.env.MONGODB_URI}lms` 
            : `${process.env.MONGODB_URI}/lms`;
            
        await mongoose.connect(uri);
        
        console.log('MongoDB connection successful')
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

export default connectDB;
