import express from "express";
import userRoutes from './userRoutes.js';
import authRoutes from "./authRoutes.js";
import musicRoutes from "./musicRoutes.js";

const app = express();

app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/', musicRoutes);


export default app;