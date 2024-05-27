//Obtener axios
import axios from "axios";
import { pool } from "../db.js";

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

function simplificarFecha(fechaCompleta) {
  // Crear un nuevo objeto Date a partir de la cadena de fecha completa
  const fecha = new Date(fechaCompleta);

  // Obtener los componentes de año, mes y día
  const año = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0'); // Meses son 0-indexados, así que sumamos 1
  const día = String(fecha.getUTCDate()).padStart(2, '0');

  // Formatear la fecha como "YYYY-MM-DD"
  const fechaSimplificada = `${año}-${mes}-${día}`;

  return fechaSimplificada;
}

//----------------------------------------------------------------//

const getArtist = async (id) => {
  // Endpoint de Spotify para obtener información sobre el artista
  const albumUrl = `https://api.spotify.com/v1/artists/${id}`;

  try {
    //Comprueba si está en BBDD
    const [result] = await pool.query(`SELECT * FROM ARTIST WHERE idArt = "${id}";`);
    if (result.length != 0) {
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
    const token = await getToken(clientId, clientSecret);
    const artist = await axios.get(albumUrl, {
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
      await pool.query(`INSERT INTO ARTIST (idArt,nameArt,imageArtUrl,genresArt,popularityArt,followers) VALUES ("${artist.data.id}","${artist.data.name}","${artist.data.images[0].url}","${genresStr}",${artist.data.popularity},${artist.data.followers.total});`)
      console.log("Insertado el artista " + artist.data.name);
    } catch (error) {
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

const getAlbum = async (albumId) => {
  // Endpoint de Spotify para obtener información de un álbum
  const albumUrl = `https://api.spotify.com/v1/albums/${albumId}`;
  try {
    //Comprueba si está en BBDD
    let album = await pool.query(`SELECT * FROM ALBUM WHERE idAlb = "${albumId}";`);
    if (album[0].length != 0) {
      let response = {
        idAlb: album[0][0].idAlb,
        artists: [],
        nameAlb: album[0][0].nameAlb,
        imageAlbUrl: album[0][0].imageAlbUrl,
        genresAlb: album[0][0].genresAlb,
        popularityAlb: album[0][0].popularityAlb,
        releaseDate: simplificarFecha(album[0][0].releaseDate),
        tracks: await getAlbumTracks(albumId) //Array con todas las canciones
      };
      // bucle que recorre los artistas de un album
      for (let i = 0; i < album[0].length; i++) {
        let artist = await pool.query(`SELECT idArt, nameArt from artist WHERE idArt = "${album[0][i].idArt}"`);
        response.artists.push(artist[0][0]);
      }
      //devuelve la info, sin usar la API
      return response;
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
        const artist = await getArtist(album.artists[i].id);
        let genresStr = "";
        for (let j = 0; j < album.genres.length; j++) {
          genresStr += album.genres[j] + " ";
        }
        await pool.query(`INSERT INTO album (idAlb,idArt,nameAlb,imageAlbUrl,genresAlb,popularityAlb,releaseDate) VALUES ("${album.id}","${artist.id}","${album.name}","${album.images[0].url}", "${genresStr}" ,${album.popularity},'${album.release_date}');`);
        console.log(`Insertado el album ${album.name}`)
      }
    } catch (error) {
      console.error('ERROR al insertar album ' + album.name + ": ", error.message);
    }

    return getAlbum(albumId);

  } catch (error) {
    console.error(`Error al obtener información del álbum: ${albumId}`, error.message);
    throw error;
  }
};

//----------------------------------------------------------------//

const getTrack = async (id) => {
  const trackUrl = `https://api.spotify.com/v1/tracks/${id}`;
  try {
    const token = await getToken(clientId, clientSecret);
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
        
        // inserta el track en la base de datos
        await pool.query(`INSERT INTO track (idTrack, idAlb, idArt, nameTrack, popularityTrack, previewUrl, duration) VALUES ("${track.data.id}", "${albumId}", "${artistId}", "${track.data.name}",${track.data.popularity},"${track.data.preview_url}",${track.data.duration_ms});`);
      }

    } catch (error) {
      console.error('ERROR al insertar Track ' + track.data.name + ": ", error.message);
    }

    return track.data;
  } catch (error) {
    console.error(`Error al obtener información del track: ${id}`, error.message);
    throw error;
  }
};

//----------------------------------------------------------------//

const getAlbumTracks = async (id) => {
  console.log("OBTENIENDO CANCIONES")
  const AlbumTracksUrl = `https://api.spotify.com/v1/albums/${id}/tracks`;
  try {
    const response = await pool.query(`select distinct(idTrack), nameTrack, previewUrl, duration from track where idAlb = "${id}";`);

    //Si en BBDD hay canciones las devuleve
    if (response[0].length != 0) {
      console.log("HAY CANCIONES EN LA BASE DE DATOS")
      let result = []
      response[0].forEach(track => {
        let data = {
          idTrack: track.idTrack,
          nameTrack: track.nameTrack,
          previewUrl: track.previewUrl,
          duration: track.duration
        }
        result.push(data);
      });
      return result;
    }
    console.log("HAY NO CANCIONES EN LA BASE DE DATOS")
    // Si la BBDD está vacia hace la petición a Spotify
    const token = await getToken(clientId, clientSecret);
    const tracks = await axios.get(AlbumTracksUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // bucle recorre tracks del album
    for (let i = 0; i < tracks.data.items.length; i++) {
      const trackId = tracks.data.items[i].id;
      console.log("API: OBTENIENDO CANCION "+trackId)
      await getTrack(trackId);
    }
    return await getAlbumTracks(id);
  } catch (error) {
    console.error(`Error al obtener canciones del álbum: ${id}`, error.message);
    throw error;
  }
}

//----------------------------------------------------------------//

const getArtistAlbums = async (artistId) => {
  const artistAlbumsUrl = `https://api.spotify.com/v1/artists/${artistId}/albums`;
  try {
    // Haciendo la solicitud para obtener información
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
  } catch (error) {
    console.error(`Error al obtener albunes del artista: ${artistId}`, error.message);
    throw error;
  }
};

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
    //console.log(newResponse.data.albums.items)
    for (let i = 0; i < newResponse.data.albums.items.length; i++) {
      await getAlbum(newResponse.data.albums.items[i].id);
    }
    return getNewReleases();
  } catch (error) {
    console.error('Error al obtener los nuevos lanzamientos:', error.message);
    throw error
  }
};


export { getArtist, getAlbum, getArtistAlbums, getTrack, getAlbumTracks, getNewReleases };

//------------------- Funcion principal ------------------------//
/* 
(async () => {

  try {
    // Obtener el token de acceso
    //const token = await getToken(clientId, clientSecret);

    const artists = await pool.query(`select idArt, count(*) from album group by idArt;`);
    // Bucle que recorre los artistas de nuestra BBDD

    for (let i = 0; i < artists[0].length; i++) {
      if (artists[0][i]['count(*)'] <= 1) {
        console.log(" - Obteneiendo albums de " + artists[0][i].idArt);
        const artistId = artists[0][i].idArt;
        await getArtistAlbums(artistId);
      }
    }


  } catch (error) {
    console.error('Error:', error.message);
  }

})();
 */
