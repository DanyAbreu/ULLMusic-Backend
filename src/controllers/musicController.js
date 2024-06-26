import { pool } from "../db.js";
import * as spotifyApi from "../api/spotifyApi.js";
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

export const getAlbum = async (req, res) => {
    try {
        const { idAlb } = req.params;
        const album = await spotifyApi.getAlbum(idAlb);
        res.send(album); //Debuelve info del album y sus canciones

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
        const {strSearch} = req.params;
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
        const userLikeResponse =  await pool.query(`SELECT * FROM userLikesArtist WHERE idArt = "${idArt}" AND id = ${idUser};`);
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
    const {idAlb, idUser} = req.query;
    let userLike = false;
    try {
        const userLikeResponse =  await pool.query(`SELECT * FROM userLikesAlbum WHERE idAlb = "${idAlb}" AND id = ${idUser};`);
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
    const {idTrack, idUser} = req.query;
    let userLike = false;
    try {
        const userLikeResponse =  await pool.query(`SELECT * FROM userLikesTrack WHERE idTrack = "${idTrack}" AND id = ${idUser};`);
        if (userLikeResponse[0].length != 0) { // Si al usuario ya le gustaba
            await pool.query(`DELETE FROM userLikesTrack WHERE idTrack = "${idTrack}" AND id = ${idUser};`);
            res.send(userLike);
        } else { // Si al usuario no le gustaba
            await pool.query(`INSERT INTO userLikesTrack (idTrack, id) VALUES ("${idTrack}", ${idUser});`);
            userLike = true;
            res.send(userLike);
        }
    } catch (error) {
        res.status(503).json({ message: 'Error al dar me gusta al Album: ' + error.message });
    }
}