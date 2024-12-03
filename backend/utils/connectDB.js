import mongoose from 'mongoose';
import dotenv from 'dotenv'

const connectDB = async () => {
    try {
        const conn = mongoose.connect(process.env.MONGO_URI);
        if (conn) {
            console.log(`Successfully connected to MongoDB`);
        }
        else {
            console.log("Cannot connect")
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;