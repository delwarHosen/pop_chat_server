import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

async function fixDatabase() {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Connected!");

        const db = mongoose.connection.db!; // ! add korlam
        
        await db.collection('conversations').dropIndex('participants_1_type_1');
        console.log("Index dropped!");
        
        await db.collection('conversations').deleteMany({ type: 'direct' });
        console.log("Old conversations deleted!");
        
        console.log("Done! Restart your server now.");
        
        await mongoose.disconnect();
        process.exit(0);
        
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

fixDatabase();