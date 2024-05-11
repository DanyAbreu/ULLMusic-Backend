import { pool } from "../db.js";

export const getNewReleases = async (req,res) => {
    try {
        const albums = await pool.query(`
        SELECT DISTINCT idAlb, nameAlb, imageAlbUrl, releaseDate
        FROM (
            SELECT *
            FROM album
            WHERE popularityAlb >= 70 AND releaseDate > '2023-01-01'
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
        res.status(503).json({message:'Error al conectar con la base de datos: '+ error.message})
        throw error;
    }
    
}