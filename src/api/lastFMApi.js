import axios from "axios";

const apiKey = '8709df7b0d8f18ed9c7b54bb1b401e8d';

//----------------------------------------------------------------//
// Metodo para obtener info de LastFM de un artista a partir del nombre

const getArtistInfo = async (artistName) => {
  const url = `http://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist=${artistName}&api_key=${apiKey}&format=json&lang=es`
  try {
    const response = await axios.get( url );
    return response.data.artist;
  } catch (error) {
      console.error(`ERROR: no se a podido conectar a LastFM (${artistName}): `, error.message );
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
// Metodo para obtener el summary de un artista por el nombre

const getArtistSummary = async (artistName) => {
  const apiArtist = await getArtistInfo(artistName);
  console.log(apiArtist);
  if (typeof apiArtist != 'undefined') {
    let summary = insertBackslash(apiArtist.bio.summary);
    let content = insertBackslash(apiArtist.bio.content);
    return [summary, content];
  } else {
    return [null, null];
  }
}

export {getArtistSummary}
