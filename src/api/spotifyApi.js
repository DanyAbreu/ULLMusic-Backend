//Obtener axios
import axios from "axios";
import {pool} from "../db.js";

// Credenciales de la aplicación en el panel de desarrolladores de Spotify
const clientId = '741295b943af455da7854611514d1fe9';
const clientSecret = 'b843b31896e14b07818bf1895f28c08d';

//----------------------------------------------------------------//

const getToken = async (clientId, clientSecret) => {
  // Endpoint de Spotify para obtener token de acceso
  const tokenUrl = 'https://accounts.spotify.com/api/token';

  // Datos de autenticación
  const authData = {
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  };

  try {
    // Haciendo la solicitud para obtener el token
    const tokenResponse = await axios.post(tokenUrl, new URLSearchParams(authData), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
   
    // Devolver el token de acceso
    return tokenResponse.data.access_token;
  } catch (error) {
    console.error('Error al obtener el token:', error.message);
    throw error;
  }
};

//----------------------------------------------------------------//

const getArtist = async(id, token) => {
  // Endpoint de Spotify para obtener información sobre el artista
  const albumUrl = `https://api.spotify.com/v1/artists/${id}`;

  try {
    //Comprueba si está en BBDD
    const [result] = await pool.query(`SELECT * FROM ARTIST WHERE idArt = "${id}";`);
    if (result.length != 0){
      const artist = {
        id: result[0].idArt,
        name: result[0].nameArt,
        images: [result[0].imageArtUrl],
        genres: [result[0].genresArt],
        popularity: result[0].popularityArt,
        followers: result[0].followers
      };
      //devuelve la info del artista, sin usar la API
      return artist;
    }
    // Haciendo la solicitud para obtener información
    const artist = await axios.get(albumUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Añade al artista en la BBDD
    try{
      let genresStr = "";
      for (let i = 0; i < artist.data.genres.length; i++) {
        genresStr += artist.data.genres[i] + " ";
      }
      await pool.query(`INSERT INTO ARTIST (idArt,nameArt,imageArtUrl,genresArt,popularityArt,followers) VALUES ("${artist.data.id}","${artist.data.name}","${artist.data.images[0].url}","${genresStr}",${artist.data.popularity},${artist.data.followers.total});`)

    }catch(error){
      console.error('Error al insertar al artista ' + artist.name + ': ', error.message);
    }

    // Devolver la información del artista
    return artist.data;
  } catch (error) {
    console.error(`Error al obtener información del artista: ${id}`, error.message);
    throw error;
  }
};

//----------------------------------------------------------------//

const getAlbum = async (albumId, artistId, token) => {
  // Endpoint de Spotify para obtener información de un álbum
  const albumUrl = `https://api.spotify.com/v1/albums/${albumId}`;
  try {

    //Comprueba si está en BBDD
    const [result] = await pool.query(`SELECT * FROM ALBUM WHERE idAlb = "${albumId}" AND idArt = "${artistId}";`);
    if (result.length != 0){
      //console.log("ENCONTRADO:" + result[0].idAlb);
      const album = {
        id: result[0].idAlb,
        artist: [{id: result[0].idArt}],
        name: result[0].nameAlb,
        images: [result[0].imageAlbUrl],
        genres: [result[0].genresAlb],
        popularity: result[0].popularityAlb,
        release_date: result[0].releasedate
      };      
      //devuelve la info, sin usar la API
      return album;
    }
 
    // Haciendo la solicitud para obtener información del álbum
    const response = await axios.get(albumUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const album = response.data;

    try{
      // Bucle para insertar a todos los artistas del album
      for (let i = 0; i < album.artists.length; i++) {
        const artist = await getArtist(album.artists[i].id,token);
        let genresStr = "";
        for (let j = 0; j < album.genres.length; j++) {
          genresStr += album.genres[j] + " ";
        }
        await pool.query(`INSERT INTO album (idAlb,idArt,nameAlb,imageAlbUrl,genresAlb,popularityAlb,releaseDate) VALUES ("${album.id}","${artist.id}","${album.name}","${album.images[0].url}", "${genresStr}" ,${album.popularity},'${album.release_date}');`);
        
      }
    }catch(error){
      console.error('ERROR al insertar album ' + album.name + ": ", error.message);
    }

    // Devolver la información del álbum
    return album;
  } catch (error) {
    console.error(`Error al obtener información del álbum: ${albumId}`, error.message);
    throw error;
  }
};

//----------------------------------------------------------------//

export const getTrack = async (id, token) => {
  const trackUrl = `https://api.spotify.com/v1/tracks/${id}`;
  try{
    const track = await axios.get(trackUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    try {
      //bucle que recorre artistas del track
      for (let i = 0; i < track.data.artists.length; i++) {
        const artistId = track.data.artists[i].id;
        const albumId = track.data.album.id;
        // Se asegura de que el artista y el album están en la base de datos
        await getArtist(artistId,token);
        await getAlbum(albumId, artistId,token);
        // inserta el track en la base de datos
        await pool.query(`INSERT INTO track (idTrack, idAlb, idArt, nameTrack, popularityTrack, previewUrl, duration) VALUES ("${track.data.id}", "${albumId}", "${artistId}", "${track.data.name}",${track.data.popularity},"${track.data.preview_url}",${track.data.duration_ms});`);
      }
      
    } catch (error) {
      console.error('ERROR al insertar Track ' + track.data.name + ": ", error.message);
    }

    return track.data;
  }catch(error){
    console.error(`Error al obtener información del track: ${id}`, error.message);
    throw error;
  }
};

//----------------------------------------------------------------//

const getAlbumTracks = async (id, token) => {
  const AlbumTracksUrl = `https://api.spotify.com/v1/albums/${id}/tracks`;

  try {
    const tracks = await axios.get(AlbumTracksUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // bucle recorre tracks del album
    for (let i = 0; i < tracks.data.items.length; i++) {
      const trackId = tracks.data.items[i].id;
      await getTrack(trackId,token);
    }
    
  } catch (error) {
    console.error(`Error al obtener canciones del álbum: ${id}`, error.message);
    throw error;
  }
}

//----------------------------------------------------------------//

const getArtistAlbums = async (artistId,token) => {
  const artistAlbumsUrl = `https://api.spotify.com/v1/artists/${artistId}/albums`;
  try {
    // Haciendo la solicitud para obtener información
    const albums = await axios.get(artistAlbumsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // bucle recorre albums del artista
    for (let i = 0; i < albums.data.items.length; i++) {
      const albumId = albums.data.items[i].id;
      console.log(" -- Obtenendo Info del album " + albums.data.items[i].name);
      await getAlbum(albumId, artistId, token);
    }
  } catch (error) {
    console.error(`Error al obtener albunes del artista: ${artistId}`, error.message);
    throw error;
  }
};

//----------------------------------------------------------------//

export const getNewReleases = async (token) => {
  const newUrl = 'https://api.spotify.com/v1/browse/new-releases'
  try {
    const newResponse = await axios.get (newUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return newResponse.data;
  } catch (error) {
    console.error('Error al obtener los nuevos lanzamientos:', error.message);
    throw error
  }
};

//------------------- Funcion principal ------------------------//

(async () => {  

  try { 
    // Obtener el token de acceso
    const token = await getToken(clientId, clientSecret);

    const artists = await pool.query(`SELECT * FROM ARTIST;`);
    // Bucle que recorre los artistas de nuestra BBDD
    for (let i=0; i < artists[0].length; i++){
      console.log(" - Obteneiendo albums de " + artists[0][i].nameArt);
      const artistId = artists[0][i].idArt;
      await getArtistAlbums(artistId,token);
    }

  }catch (error) {
    console.error('Error:', error.message);
  }

})();
