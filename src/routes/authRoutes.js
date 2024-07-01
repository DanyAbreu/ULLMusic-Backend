import cors from "cors";
import bodyParser from "body-parser";
import express from "express";

import {
    login,
    register,

  } from "../controllers/authController.js";

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.post("/login", login);
app.post("/register", register);

export default app;


