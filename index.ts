import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "routes/auth.routes"


dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());

app.use("/auth",authRoutes)

app.get("/", (req, res) => {
    res.send("server is running");
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    console.log("Database Connected");
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.log("MongoDB connected error ", error);
})


