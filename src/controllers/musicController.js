import { pool } from "../db.js";
import * as spotifyApi from "../api/spotifyApi.js";

export const getNewReleases = async (req, res) => {
    try {
        const albums = await pool.query(`
        SELECT DISTINCT idAlb, nameAlb, imageAlbUrl, releaseDate
        FROM (
            SELECT *
            FROM album
            WHERE popularityAlb >= 50 AND releaseDate > '2023-01-01'
            ORDER BY releaseDate DESC
            LIMIT 50
        ) AS subquery
        ORDER BY releaseDate DESC;`);
        let result = [];
        let data = {}
        //Prepara el array de Json a devolver
        for (let i = 0; i < albums[0].length; i++) {
            //obtengo a todos los artistas del album
            let artists = await pool.query(`
            select nameArt from artist where idArt in (
            select idArt from album where idAlb = "${albums[0][i].idAlb}");`);
            data = {
                idAlb: albums[0][i].idAlb,
                nameAlb: albums[0][i].nameAlb,
                imageAlbUrl: albums[0][i].imageAlbUrl,
                artists: artists[0]
            }
            result.push(data);
        }
        res.send(result);
    } catch (error) {
        res.status(503).json({ message: 'Error al conectar con la base de datos: ' + error.message })
        throw error;
    }
}

export const getAlbum = async (req, res) => {
    try {
        const { idAlb } = req.params;
        const album = await spotifyApi.getAlbum(idAlb);
        //console.log(album);
        res.send(album);
        /* 
        const album = await pool.query(`SELECT * FROM album WHERE idAlb = "${idAlb}"`);
        let response = {
            idAlb: album[0][0].idAlb,
            artists: [],
            nameAlb: album[0][0].nameAlb,
            imageAlbUrl: album[0][0].imageAlbUrl,
            genresAlb: album[0][0].genresAlb,
            popularityAlb: album[0][0].popularityAlb,
            releaseDate: simplificarFecha(album[0][0].releaseDate)
        };
        // bucle que recorre los artistas de un album
        for (let i = 0; i < album[0].length; i++) {
            let artist = await pool.query(`SELECT idArt, nameArt from artist WHERE idArt = "${album[0][i].idArt}"`);
            response.artists.push(artist[0][0]);
        } */
    } catch (error) {
        res.status(503).json({ message: 'Error al conectar con la base de datos: ' + error.message })
        throw error;
    }
}