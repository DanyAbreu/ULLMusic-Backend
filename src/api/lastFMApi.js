import axios from "axios";
import {pool} from "../db.js";

const apiKey = '8709df7b0d8f18ed9c7b54bb1b401e8d';
const sharedSecret = 'f8155224b0e9503e5a35d64ca74c0c7d';

//----------------------------------------------------------------//
// Metodo para obtener a todos los artistas de mySQL
export const getAllArtists = async () => {
  try {
    const response = await pool.query("Select nameArt, summary FROM artist;");
    return response[0];
  } catch (error) {
    console.error("ERROR: no se a podido conectar la base de Datos: ", error.message);
      throw error;
  }
}

//----------------------------------------------------------------//
// Metodo para obtener info de LastFM de un artista a partir del nombre
export const getArtistInfo = async (artistName) => {
  const url = `http://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist=${artistName}&api_key=${apiKey}&format=json&lang=es`
  try {
    const response = await axios.get( url );
    return response.data.artist;
  } catch (error) {
      console.error(`ERROR: no se a podido conectar a LastFM (${artistName}): `/* , error.message */);
      throw error;
  }
}

//----------------------------------------------------------------//
// Metodo para actualizar la bio de un artista

export const updateArtist = async (nameArt, summary, content) => {
  try {
    await pool.query(`
      UPDATE Artist
      SET summary = ?, content = ?
      WHERE nameArt = ?;`,
    [
      summary,
      content,
      nameArt
    ]);
    console.log("ACTUALIZADO el artista : " + nameArt);
  } catch (error) {
    console.error(`ERROR: no se ha podido actualizar la base de datos (${nameArt}): `, error.message);
    throw error;
  }
}

//----------------------------------------------------------------//
// Metodo para evitar problemas de sintaxis al insertar cadenas

function insertBackslash(str) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
      if (str[i] === '\'') {
          result += '\\';
      }
      result += str[i];
  }
  return result;
}

//----------------------------------------------------------------//
// Metodo para actualizar la biografia de los artistas

const upDateArtists = async () => {
  const artists = await getAllArtists();
  for (let i = 0; i < artists.length; i++) {
    const artist = artists[i];
    if (artist.summary == null) {
      const apiArtist = await getArtistInfo(artist.nameArt);
      if (typeof apiArtist != 'undefined') {
        let summary = insertBackslash(apiArtist.bio.summary);
        let content = insertBackslash(apiArtist.bio.content);
        await updateArtist(artist.nameArt, summary, content);
      }
    }
  }
}

//----------------------------------------------------------------//
// Metodo para obtener la info de un album

export const getAlbumInfo = async (artistName,albumName) => {
  const url = `http://ws.audioscrobbler.com//2.0/?method=album.getinfo&api_key=${apiKey}&artist=${artistName}&album=${albumName}&format=json&lang=es`
  try {
    const response = await axios.get( url );
    return response.data.album;
  } catch (error) {
      console.error(`ERROR: no se a podido conectar a LastFM (${artistName}): `/* , error.message */);
      throw error;
  }
}

//----------------------------------------------------------------//
// Función principal

(async () => {
  await upDateArtists();
//let response = await getAlbumInfo("ariana grande","Sweetener")
//console.log(response)
  
})();