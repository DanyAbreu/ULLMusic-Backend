import { pool } from "../db.js";

export const getNewReleases = async (req,res) => {
    try {
        const result = await pool.query(`
        SELECT *
        FROM album
        WHERE popularityAlb >= 70 AND releaseDate >= '2023-01-01' 
        ORDER BY releaseDate DESC
        LIMIT 50;`);
        res.send(result[0]);
    } catch (error) {
        res.status(503).json({message:'Error al conectar con la base de datos: '+ error.message})
        throw error;
    }
    
}