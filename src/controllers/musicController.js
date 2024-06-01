import { pool } from "../db.js";
import * as spotifyApi from "../api/spotifyApi.js";
import { response } from "express";



export const getNewReleases = async (req, res) => {
    try {
        const newAlbums = await spotifyApi.getNewReleases();
        res.send(newAlbums); //Devuelve un arreglo de nuevos albunes
    } catch (error) {
        res.status(503).json({ message: 'Error al obtener nuevos albunes: ' + error.message })
        throw error;
    }
}

export const getAlbum = async (req, res) => {
    try {
        const { idAlb } = req.params;
        const album = await spotifyApi.getAlbum(idAlb);
        res.send(album); //Debuelve info del album y sus canciones

    } catch (error) {
        res.status(503).json({ message: 'Error al obtener el album: ' + error.message })
        throw error;
    }
}

export const getArtist = async (req, res) => {
    try {
        const {idArt} = req.params; 
        let artist = await spotifyApi.getArtist(idArt);
        const response = {
            idArt: artist.idArt,
            nameArt: artist.nameArt,
            imageArtUrl: artist.imageArtUrl,
            genresArt: artist.genresArt,
            popularityArt: artist.popularityArt,
            followers: artist.followers,
            summary: artist.summary,
            content: artist.content,
            albums: await spotifyApi.getArtistAlbums(idArt)
        };
        res.send(response);
    } catch (error) {
        res.status(503).json({ message: 'Error al obtener al artista: ' + error.message })
    }
}