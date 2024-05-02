import cors from "cors";
import bodyParser from "body-parser";
import express from "express";

const app = express();
app.use(cors());
app.use(bodyParser.json());

import {
    getNewReleases
} from "../controllers/musicController.js";

app.get("/news",getNewReleases);

export default app;