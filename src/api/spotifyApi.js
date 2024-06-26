//Obtener axios
import axios from "axios";
import { pool } from "../db.js";

// Credenciales de la aplicación en el panel de desarrolladores de Spotify
const clientId = '741295b943af455da7854611514d1fe9';
const clientSecret = 'b843b31896e14b07818bf1895f28c08d';

//----------------------------------------------------------------//
// Metodó para obtener un token para realizar peticiones a la api de Spotify

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
// Método para cambiar la duración de las canciones de milisegundos a minutos

function convertMillisecondsToMinutes(ms) {
  // Calcular los minutos y segundos
  let totalSeconds = Math.floor(ms / 1000);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;

  // Formatear los segundos para que siempre tengan dos dígitos
  let formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

  // Devolver el resultado en el formato 0:00
  return `${minutes}:${formattedSeconds}`;
}

//----------------------------------------------------------------//
// Método para obtener un artista

const getArtist = async (idArt) => {
  // Endpoint de Spotify para obtener información sobre el artista
  const artistUrl = `https://api.spotify.com/v1/artists/${idArt}`;

  try {
    //Comprueba si está en BBDD
    const [result] = await pool.query(`SELECT * FROM ARTIST WHERE idArt = "${idArt}";`);
    if (result.length != 0) {
      //devuelve la info del artista, sin usar la API
      return result[0];
    }
    // Haciendo la solicitud para obtener información
    const token = await getToken(clientId, clientSecret);
    const artist = await axios.get(artistUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Añade al artista en la BBDD
    try {
      let genresStr = "";
      for (let i = 0; i < artist.data.genres.length; i++) {
        genresStr += artist.data.genres[i] + " ";
      }
      if (artist.data.images.length > 0) {
        await pool.query(`INSERT INTO ARTIST (idArt,nameArt,imageArtUrl,genresArt,popularityArt,followers) VALUES (?,?,?,?,?,?);`,
      [
        artist.data.id,
        artist.data.name,
        artist.data.images[0].url,
        genresStr,
        artist.data.popularity,
        artist.data.followers.total
      ]);
      }else{
        await pool.query(`INSERT INTO ARTIST (idArt,nameArt,imageArtUrl,genresArt,popularityArt,followers) VALUES ("${artist.data.id}","${artist.data.name}",null,"${genresStr}",${artist.data.popularity},${artist.data.followers.total});`)
      }
      console.log("Insertado el artista " + artist.data.name);
    } catch (error) {
      console.error('Error al insertar al artista ' + artist.name + ': ', error.message);
    }
    
    // Devolver la información del artista
    return await getArtist(idArt);
  } catch (error) {
    console.error(`Error al obtener información del artista: ${idArt}`, error.message);
    throw error;
  }
};

//----------------------------------------------------------------//
// Método para obtener un artista

const getAlbum = async (albumId) => {
  // Endpoint de Spotify para obtener información de un álbum
  const albumUrl = `https://api.spotify.com/v1/albums/${albumId}`;
  try {
    //Comprueba si está en BBDD
    let album = await pool.query(`SELECT * FROM ALBUM WHERE idAlb = "${albumId}";`);
    if (album[0].length != 0) {

      // bucle que recorre los artistas del album 
      // para comprobar que estén en mySQL
      for (let i = 0; i < album[0].length; i++) {
        await getArtist(album[0][i].idArt);
      }
      //devuelve la info, sin usar la API
      return album[0];
    }

    // Haciendo la solicitud para obtener información del álbum
    const token = await getToken(clientId, clientSecret);
    const response = await axios.get(albumUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    album = response.data;

    try {
      // Bucle para insertar a todos los artistas del album
      for (let i = 0; i < album.artists.length; i++) {
        // Comprueba que el artista está en la BBDD
        await getArtist(album.artists[i].id);
        let genresStr = "";
        for (let j = 0; j < album.genres.length; j++) {
          genresStr += album.genres[j] + " ";
        }
        await pool.query(`INSERT INTO album (idAlb,idArt,nameAlb,imageAlbUrl,genresAlb,popularityAlb,releaseDate) VALUES (?,?,?,?,?,?,?);`,
          [
            album.id,
            album.artists[i].id,
            album.name,
            album.images[0].url,
            genresStr,
            album.popularity,
            album.release_date
          ]);
        console.log(`Insertado el album ${album.name}`)
      }
      return await getAlbum(albumId);
    } catch (error) {
      console.error('ERROR al insertar album ' + album.name + ": ", error.message);
    }

  } catch (error) {
    console.error(`Error al obtener información del álbum: ${albumId}`, error.message);
    throw error;
  }
};

//----------------------------------------------------------------//
// Método para obtener una canción

const getTrack = async (idTrack) => {
  const trackUrl = `https://api.spotify.com/v1/tracks/${idTrack}`;
  try {
    const response = await pool.query(`SELECT * FROM track WHERE idTrack = "${idTrack}"`);
    // Si el track está en la base de datos devuelve el objeto
    if (response[0].length != 0) {
      let track = {
        idTrack: response[0].idTrack,
        idAlb: response[0].idAlb,
        idArt: response[0].idArt,
        nameTrack: response[0].nameTrack,
        popularityTrack: response[0].popularityTrack,
        previewUrl: response[0].previewUrl,
        duration: convertMillisecondsToMinutes(response[0].duration)
      }
      return track;
    }
    //En caso de que el track no esté en la BBDD
    const token = await getToken(clientId, clientSecret);
    const track = await axios.get(trackUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    try {
      //bucle que recorre artistas del track
      for (let i = 0; i < track.data.artists.length; i++) {
        const idArt = track.data.artists[i].id;
        const albumId = track.data.album.id;
        console.log(`Insertando la canción: ${track.data.name}`);
        // inserta el track en la base de datos
        await pool.query(
          `INSERT INTO track (idTrack, idAlb, idArt, nameTrack, popularityTrack, previewUrl, duration)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            track.data.id,
            albumId,
            idArt,
            track.data.name,
            track.data.popularity,
            track.data.preview_url,
            track.data.duration_ms
          ]
        );
        const response = await pool.query(`SELECT * FROM track WHERE idTrack = "${idTrack}"`);
        // Si el track está en la base de datos devuelve el objeto
        if (response[0].length != 0) {
          let track = {
            idTrack: response[0].idTrack,
            idAlb: response[0].idAlb,
            idArt: response[0].idArt,
            nameTrack: response[0].nameTrack,
            popularityTrack: response[0].popularityTrack,
            previewUrl: response[0].previewUrl,
            duration: convertMillisecondsToMinutes(response[0].duration)
          }
          return track;
        }
      }

    } catch (error) {
      console.error('ERROR al insertar Track ' + track.data.name + ": ", error.message);
    }

  } catch (error) {
    console.error(`Error al obtener información del track: ${idTrack}`, error.message);
    throw error;
  }
};

//----------------------------------------------------------------//
// Método para obtener las canciones de un album

const getAlbumTracks = async (idAlb, idUser) => {
  const AlbumTracksUrl = `https://api.spotify.com/v1/albums/${idAlb}/tracks `;
  try {
    const mySQLResponse = await pool.query(`SELECT DISTINCT(idTrack), nameTrack, previewUrl, duration FROM track WHERE idAlb = "${idAlb}";`);

    //Si en BBDD hay canciones las devuleve
    let tracks = [];
    if (mySQLResponse[0].length != 0) {
      for (let i = 0; i < mySQLResponse[0].length; i++) {
        // método para saber si al usuario le gusta el track
        const userLikeResponse = await pool.query(`SELECT * FROM userLikesTrack WHERE idTrack = "${mySQLResponse[0][i].idTrack}" AND id = ${idUser};`);
        let userLike = false;
        if (userLikeResponse[0].length != 0) {
          userLike = true; //Si le gusta
        }

        let track = {
          idTrack: mySQLResponse[0][i].idTrack,
          nameTrack: mySQLResponse[0][i].nameTrack,
          previewUrl: mySQLResponse[0][i].previewUrl,
          duration: convertMillisecondsToMinutes(mySQLResponse[0][i].duration),
          userLike: userLike
        }
        tracks.push(track);
      }
      return tracks;
    }
    // Si la BBDD está vacia hace la petición a Spotify
    else {
      const token = await getToken(clientId, clientSecret);
      const apiResponse = await axios.get(AlbumTracksUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // bucle recorre tracks del album
      for (let i = 0; i < apiResponse.data.items.length; i++) {
        const trackId = apiResponse.data.items[i].id;
        await getTrack(trackId);
      }
      const response = await pool.query(`SELECT DISTINCT(idTrack), nameTrack, previewUrl, duration FROM track WHERE idAlb = "${id}";`);
      let tracks = [];
      for (let i = 0; i < response[0].length; i++) {
        let track = {
          idTrack: response[0][i].idTrack,
          idAlb: response[0][i].idAlb,
          idArt: response[0][i].idArt,
          nameTrack: response[0][i].nameTrack,
          popularityTrack: response[0][i].popularityTrack,
          previewUrl: response[0][i].previewUrl,
          duration: convertMillisecondsToMinutes(response[0][i].duration),
          userLike: false
        }
        tracks.push(track)
      }
      return tracks;
    }
  } catch (error) {
    console.error(`Error al obtener canciones del álbum: ${idAlb}`, error.message);
    throw error;
  }
}

//----------------------------------------------------------------//
// Método para obtener los albumes de un artista

const getArtistAlbums = async (idArt, idUser) => {
  const artistAlbumsUrl = `https://api.spotify.com/v1/artists/${idArt}/albums`;
  try {
    // Solicitud a la BBDD
    const sqlAlbums = await pool.query(`SELECT * FROM Album WHERE idArt = "${idArt}" order by popularityAlb desc;`);
   
    // Si tiene Albumes los devuelve
    if (sqlAlbums[0].length > 5) {
      let albumsResponse = [];
      // Bucle que recorre los albumes de la base de datos
      for (let i = 0; i < sqlAlbums[0].length; i++) {
        // método para saber si al usuario le gusta el album
        const userLikeResponse = await pool.query(`SELECT * FROM userLikesAlbum WHERE idAlb = "${sqlAlbums[0][i].idAlb}" AND id = ${idUser};`);
        let userLike = false;
        if (userLikeResponse[0].length != 0) {
          userLike = true; //Si le gusta
        }
        // Objeto album simplificado
        let response = {
          idAlb: sqlAlbums[0][i].idAlb,
          nameAlb: sqlAlbums[0][i].nameAlb,
          imageAlbUrl: sqlAlbums[0][i].imageAlbUrl,
          userLike: userLike
        };
        albumsResponse.push(response);
      }
      return albumsResponse;
    }
    // Si no tiene hace la solicitud
    const token = await getToken(clientId, clientSecret);
    const albums = await axios.get(artistAlbumsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // bucle recorre albums del artista
    for (let i = 0; i < albums.data.items.length; i++) {
      const albumId = albums.data.items[i].id;
      console.log(" -- Obtenendo Info del album " + albums.data.items[i].name);
      await getAlbum(albumId);
    }
    return await getArtistAlbums(idArt, idUser);

  } catch (error) {
    console.error(`Error al obtener albunes del artista: ${idArt}`, error.message);
    throw error;
  }
};

//----------------------------------------------------------------//
// Método para obtener las canciones de un artista

const getArtistTracks = async (idArt, idUser) => {
  const [mySQLResponse] = await pool.query("SELECT * FROM track WHERE idArt = ? order by popularityTrack desc;",
    [
      idArt
    ]);

  let tracks = [];
  for (let i = 0; i < mySQLResponse.length; i++) {
    // método para saber si al usuario le gusta el track
    const userLikeResponse = await pool.query(`SELECT * FROM userLikesTrack WHERE idTrack = "${mySQLResponse[i].idTrack}" AND id = ${idUser};`);
    let userLike = false;
    if (userLikeResponse[0].length != 0) {
      userLike = true; //Si le gusta
    }

    let track = {
      idTrack: mySQLResponse[i].idTrack,
      idAlb: mySQLResponse[i].idAlb,
      idArt: mySQLResponse[i].idArt,
      nameTrack: mySQLResponse[i].nameTrack,
      popularityTrack: mySQLResponse[i].popularityTrack,
      previewUrl: mySQLResponse[i].previewUrl,
      duration: convertMillisecondsToMinutes(mySQLResponse[i].duration),
      userLike: userLike
    }
    tracks.push(track);
  }
  return tracks;
}

//----------------------------------------------------------------//
// Método para obtener las nuevas novedades

const getNewReleases = async () => {
  const newUrl = 'https://api.spotify.com/v1/browse/new-releases'
  try {
    //-----------------------------------------------------------
    //Primero intenta buscar en la base de datos
    const albums = await pool.query(`
      SELECT DISTINCT idAlb, nameAlb, imageAlbUrl, releaseDate
      FROM (
          SELECT *
          FROM album
          WHERE releaseDate > '2022-01-01' AND idArt In (
          SELECT idArt FROM artist WHERE popularityArt >= 50)
          ORDER BY releaseDate DESC
          LIMIT 100
      ) AS subquery
      ORDER BY releaseDate DESC;`);
    if (albums[0].length != 0) {
      let result = [];
      let data = {}
      //Prepara el array de Json a devolver
      for (let i = 0; i < albums[0].length; i++) {
        //obtengo a todos los artistas del album
        let artists = await pool.query(`
            SELECT idArt, nameArt FROM artist WHERE idArt in (
            SELECT idArt FROM album WHERE idAlb = "${albums[0][i].idAlb}");`);
        data = {
          idAlb: albums[0][i].idAlb,
          nameAlb: albums[0][i].nameAlb,
          imageAlbUrl: albums[0][i].imageAlbUrl,
          artists: artists[0]
        }
        result.push(data);
      }
      return result;
    }
    // -----------------------------------------------------
    // LLega aquí solo si la BBDD está vacía
    const token = await getToken(clientId, clientSecret);
    const newResponse = await axios.get(newUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    for (let i = 0; i < newResponse.data.albums.items.length; i++) {
      await getAlbum(newResponse.data.albums.items[i].id);
    }
    return getNewReleases();
  } catch (error) {
    console.error('Error al obtener los nuevos lanzamientos:', error.message);
    throw error
  }
};

//----------------------------------------------------------------//
// Método busqueda de artistas por nombre

const getArtistByName = async (nameArt) => {
  try {
    // Intenta conectar a la BBDD
    const [mySQLResponse] = await pool.query(`SELECT * FROM artist WHERE nameArt like "%${nameArt}%";`);
    //Si encuentra resultados los devuelve
    if (mySQLResponse.length != 0) {
      return mySQLResponse;
    }
    //en caso de no encontrarlos hace petición a la API
    else {
      const searchUrl = `https://api.spotify.com/v1/search?q=${nameArt}&type=artist`;
      const token = await getToken(clientId, clientSecret);
      const apiResponse = await axios.get(searchUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      let response = []
      for (let i = 0; i < apiResponse.data.artists.items.length; i++) {
        const artist = await getArtist(apiResponse.data.artists.items[i].id);
        response.push(artist);
      }
      return response;
    }
  } catch (error) {
    console.error(`Error al obtener información del artista: ${nameArt}`, error.message);
    throw error;
  }

};

//----------------------------------------------------------------//
// Método busqueda de albunes por nombre

const getAlbumByName = async (nameAlb) => {
  try {
    // Intenta conectar a la BBDD
    const [mySQLResponse] = await pool.query(`SELECT * FROM album WHERE nameAlb like "%${nameAlb}%";`);
    return mySQLResponse;

  } catch (error) {
    console.error(`Error al obtener información del album: ${nameAlb}`, error.message);
    throw error;
  }
};

//----------------------------------------------------------------//
// Método busqueda de canciones por nombre

const getTrackByName = async (nameTrack) => {
  try {
    // Intenta conectar a la BBDD
    const [mySQLResponse] = await pool.query(`SELECT * FROM track WHERE nameTrack like "%${nameTrack}%";`);
    return mySQLResponse;

  } catch (error) {
    console.error(`Error al obtener información del track: ${nameTrack}`, error.message);
    throw error;
  }
};

export { getArtist, getAlbum, getTrack, getArtistAlbums, getArtistTracks, getAlbumTracks, getNewReleases, getArtistByName, getAlbumByName, getTrackByName };

//------------------- Funcion principal ------------------------//
/* 
(async () => {

  try {
    // Obtener el token de acceso
    //const token = await getToken(clientId, clientSecret);

    const artists = await pool.query(`SELECT idArt, count(*) FROM album group by idArt;`);
    // Bucle que recorre los artistas de nuestra BBDD

    for (let i = 0; i < artists[0].length; i++) {
      if (artists[0][i]['count(*)'] <= 1) {
        console.log(" - Obteneiendo albums de " + artists[0][i].idArt);
        const idArt = artists[0][i].idArt;
        await getArtistAlbums(idArt);
      }
    }


  } catch (error) {
    console.error('Error:', error.message);
  }

})();
 */
