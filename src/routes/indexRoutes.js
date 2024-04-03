import express from "express";
import userRoutes from './userRoutes.js';
import authRoutes from "./authRoutes.js"

const app = express();

app.use('/users', userRoutes);
app.use('/auth', authRoutes);


export default app;