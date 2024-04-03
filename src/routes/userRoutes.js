import cors from "cors";
import bodyParser from "body-parser";
import express from "express";
import {checkJwt} from './../middlewares/jwt.js';

const app = express()
app.use(cors())
app.use(bodyParser.json())

import {
  getAll,
  getById,
  newUser,
  editUser,
  deleteUser,
} from "../controllers/userController.js";

app.get("/", getAll);
app.get('/:id', checkJwt, getById);
app.post('/add', newUser);
app.post("/:id", checkJwt, editUser);
app.delete("/:id", checkJwt, deleteUser);

export default app;