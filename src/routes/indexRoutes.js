import express from "express";
import authRoutes from "./authRoutes.js";
import musicRoutes from "./musicRoutes.js";

const app = express();

app.use('/auth', authRoutes);
app.use('/', musicRoutes);


export default app;