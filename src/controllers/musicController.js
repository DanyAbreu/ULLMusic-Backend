import { pool } from "../db.js";
import * as spotifyApi from "../api/spotifyApi.js";
import { response } from "express";
//import { response } from "express";



export const getNewReleases = async (req, res) => {
    try {
        const newAlbums = await spotifyApi.getNewReleases();
        res.send(newAlbums); //Devuelve un arreglo de nuevos albunes
    } catch (error) {
        res.status(503).json({ message: 'Error al obtener nuevos albunes: ' + error.message });
        throw error;
    }
}

//----------------------------------------------------------------//
// Método para simplificar las fechas

function simplifyDate(completeDate) {
    // Crear un nuevo objeto Date a partir de la cadena de fecha completa
    const date = new Date(completeDate);

    // Obtener los componentes de año, mes y día
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Meses son 0-indexados, así que sumamos 1
    const day = String(date.getUTCDate()).padStart(2, '0');

    // Formatear la fecha como "YYYY-MM-DD"
    return `${year}-${month}-${day}`;
}

export const getAlbum = async (req, res) => {
    try {
        const { idAlb, idUser } = req.query;
        const album = await spotifyApi.getAlbum(idAlb);

        // Metodo para comprobar si al usuario le gusta el Album
        const userLikeResponse = await pool.query(`SELECT * FROM userLikesAlbum WHERE idAlb = "${idAlb}" AND id = ${idUser};`);
        let userLike = false;
        if (userLikeResponse[0].length != 0) {
            userLike = true; //Si le gusta
        }

        let response = {
            idAlb: album[0].idAlb,
            artists: [],
            nameAlb: album[0].nameAlb,
            imageAlbUrl: album[0].imageAlbUrl,
            genresAlb: album[0].genresAlb,
            popularityAlb: album[0].popularityAlb,
            releaseDate: simplifyDate(album[0].releaseDate),
            tracks: await spotifyApi.getAlbumTracks(idAlb, idUser), //Array con todas las canciones
            userLike: userLike
        };
        // bucle que recorre los artistas de un album
        for (let i = 0; i < album.length; i++) {
            let artist = await pool.query(`SELECT idArt, nameArt FROM artist WHERE idArt = "${album[i].idArt}"`);
            response.artists.push(artist[0][0]);
        }

        res.send(response); //Debuelve info del album y sus canciones

    } catch (error) {
        res.status(503).json({ message: 'Error al obtener el album: ' + error.message });
        throw error;
    }
}

export const getArtist = async (req, res) => {
    try {
        // Obtener los parámetros de la consulta
        const { idArt, idUser } = req.query;

        const artist = await spotifyApi.getArtist(idArt);
        const userLikeResponse = await pool.query(`SELECT * FROM userLikesArtist WHERE idArt = "${idArt}" AND id = ${idUser};`);

        let userLike = false;
        if (userLikeResponse[0].length != 0) {
            userLike = true; //Si le gusta
        }

        const response = {
            idArt: artist.idArt,
            nameArt: artist.nameArt,
            imageArtUrl: artist.imageArtUrl,
            genresArt: artist.genresArt,
            popularityArt: artist.popularityArt,
            followers: artist.followers,
            summary: artist.summary,
            content: artist.content,
            albums: await spotifyApi.getArtistAlbums(idArt, idUser),
            tracks: await spotifyApi.getArtistTracks(idArt, idUser),
            userLike: userLike
        };
        res.send(response);
    } catch (error) {
        res.status(503).json({ message: 'Error al obtener al artista: ' + error.message });
    }
}

export const getSearch = async (req, res) => {
    try {
        const { strSearch } = req.params;
        const artists = await spotifyApi.getArtistByName(strSearch);
        const albums = await spotifyApi.getAlbumByName(strSearch);
        const tracks = await spotifyApi.getTrackByName(strSearch);
        const search = {
            artists: artists,
            albums: albums,
            tracks: tracks
        }
        res.send(search);
    } catch (error) {
        res.status(503).json({ message: 'Error al obtener la busqueda: ' + error.message });
    }
}

export const userLikesArtist = async (req, res) => {
    const { idArt, idUser } = req.query;
    let userLike = false;
    try {
        const userLikeResponse = await pool.query(`SELECT * FROM userLikesArtist WHERE idArt = "${idArt}" AND id = ${idUser};`);
        if (userLikeResponse[0].length != 0) { // Si al usuario ya le gustaba
            await pool.query(`DELETE FROM userLikesArtist WHERE idArt = "${idArt}" AND id = ${idUser};`);
            res.send(userLike);
        } else { // Si al usuario no le gustaba
            await pool.query(`INSERT INTO userLikesArtist (idArt, id) VALUES ("${idArt}", ${idUser});`);
            userLike = true;
            res.send(userLike);
        }
    } catch (error) {
        res.status(503).json({ message: 'Error al dar me gusta al Artista: ' + error.message });
    }
}

export const userLikesAlbum = async (req, res) => {
    const { idAlb, idUser } = req.query;
    let userLike = false;
    try {
        const userLikeResponse = await pool.query(`SELECT * FROM userLikesAlbum WHERE idAlb = "${idAlb}" AND id = ${idUser};`);
        if (userLikeResponse[0].length != 0) { // Si al usuario ya le gustaba
            await pool.query(`DELETE FROM userLikesAlbum WHERE idAlb = "${idAlb}" AND id = ${idUser};`);
            res.send(userLike);
        } else { // Si al usuario no le gustaba
            await pool.query(`INSERT INTO userLikesAlbum (idAlb, id) VALUES ("${idAlb}", ${idUser});`);
            userLike = true;
            res.send(userLike);
        }
    } catch (error) {
        res.status(503).json({ message: 'Error al dar me gusta al Album: ' + error.message });
    }
}

export const userLikesTrack = async (req, res) => {
    const { idTrack, idUser } = req.query;
    let userLike = false;
    try {
        const userLikeResponse = await pool.query(`SELECT * FROM userLikesTrack WHERE idTrack = "${idTrack}" AND id = ${idUser};`);
        if (userLikeResponse[0].length != 0) { // Si al usuario ya le gustaba
            await pool.query(`DELETE FROM userLikesTrack WHERE idTrack = "${idTrack}" AND id = ${idUser};`);
            res.send(userLike);
        } else { // Si al usuario no le gustaba
            await pool.query(`INSERT INTO userLikesTrack (idTrack, id) VALUES ("${idTrack}", ${idUser});`);
            userLike = true;
            res.send(userLike);
        }
    } catch (error) {
        res.status(503).json({ message: 'Error al dar me gusta al Track: ' + error.message });
    }
}

export const getUserLikes = async (req, res) => {
    try {
        const { idUser } = req.query;
        const userLikesArtists = await pool.query(`SELECT distinct(idArt), nameArt, imageArtUrl FROM artist WHERE idArt IN (
        SELECT idArt FROM userLikesArtist WHERE id = ${idUser} );`);
        const userLikesAlbums = await pool.query(`SELECT distinct(idAlb), nameAlb, imageAlbUrl FROM album WHERE idAlb IN (
        SELECT idAlb FROM userLikesAlbum WHERE id = ${idUser} );`);
        const userLikesTracks = await pool.query(`SELECT distinct(idTrack), nameTrack, previewUrl, duration FROM track WHERE idTrack IN (
        SELECT idTrack FROM userLikesTrack WHERE id = ${idUser} );`);
        let response = {
            artists: userLikesArtists[0],
            albums: userLikesAlbums[0],
            tracks: userLikesTracks[0]
        }
        res.send(response);
    } catch (error) {
        res.status(503).json({ message: 'Error al obtener los gustos del usuario: ' + error.message });
    }
}