import cors from "cors";
import bodyParser from "body-parser";
import express from "express";

const app = express();
app.use(cors());
app.use(bodyParser.json());

import {
    getAlbum,
    getArtist,
    getNewReleases,
    getSearch
} from "../controllers/musicController.js";

app.get("/news",getNewReleases);
app.get("/album/:idAlb",getAlbum);
app.get("/artist/:idArt",getArtist);
app.get("/search/:strSearch",getSearch);


export default app;