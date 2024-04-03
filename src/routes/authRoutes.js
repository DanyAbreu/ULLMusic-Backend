import cors from "cors";
import bodyParser from "body-parser";
import express from "express";

import {
    login,
    register,
    // changePassword
  } from "../controllers/authController.js";

const app = express()
app.use(cors())
app.use(bodyParser.json())

//login
app.post("/login", login);
app.post("/register", register);
// app.post("/change-password", changePassword);

export default app;