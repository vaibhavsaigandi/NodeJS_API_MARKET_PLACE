import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import adRoutes from "./routes/ad.js";
const app = express();
//middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
//connect to mongoDB
mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    //
    console.log("DB connected");
    app.listen(3000, () => {
      console.log("Server is listening on the port 8000");
    });
    //routes middlewares
    app.use("/api", authRoutes); //  routes middlewares for auth routes
    app.use("/api", adRoutes); //routes middlewares for ad routes
  })
  .catch((err) => {
    console.log("DB connection Error:", err);
  });

// //routes middlewares
// app.use("/api", authRoutes);

// app.get("/api", (req, res) => {
//   res.send(`The Current time is ${new Date().toLocaleTimeString()}`);
// });
