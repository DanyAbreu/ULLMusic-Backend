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
    getSearch,
    userLikesAlbum,
    userLikesArtist,
    userLikesTrack
} from "../controllers/musicController.js";

app.get("/news",getNewReleases);
app.get("/album/:idAlb",getAlbum);
app.get("/artist",getArtist);
app.get("/search/:strSearch",getSearch);
app.get("/userLikesArtist",userLikesArtist);
app.get("/userlikesAlbum",userLikesAlbum);
app.get("/userLikesTrack",userLikesTrack);


export default app;