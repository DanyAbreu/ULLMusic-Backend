import { pool } from "../db.js";
import * as spotifyApi from "../api/spotifyApi.js";

export const getNewReleases = async (req, res) => {
    try {
        const newAlbums = await spotifyApi.getNewReleases();
        res.send(newAlbums);
    } catch (error) {
        res.status(503).json({ message: 'Error al conectar con la base de datos: ' + error.message })
        throw error;
    }
}

export const getAlbum = async (req, res) => {
    try {
        const { idAlb } = req.params;
        const album = await spotifyApi.getAlbum(idAlb);
        res.send(album);

    } catch (error) {
        res.status(503).json({ message: 'Error al conectar con la base de datos: ' + error.message })
        throw error;
    }
}