import { pool } from "../db.js";
import bcrypt from 'bcryptjs';


export const getAll = async (req,res)=>{
    //res.send('getALL')
    const result = await pool.query("SELECT * FROM user")
    if (result.length > 0){
        res.send(result[0])
    }
    else{
        res.status(404).json({message:'Sin resultados'})
    }
    
}
export const getById = async (req,res)=>{
    //res.send('getById')
    const { id } = req.params;
    const [result] = await pool.query("SELECT id,username,address FROM user WHERE id = ?", id);
    if (result.length > 0){
        res.send(result[0])
    }
    else{
        res.status(404).json({message:'Sin resultados'})
    }
}

export const newUser = async (req,res)=>{
    const {username, address, passwd} = req.body;

    const [result] = await pool.query(`SELECT * FROM user WHERE username = ?`, username);
    if (result.length > 0) {
        res.status(409).json({message:'El nombre de usuario ya está en uso, por favor use otro nombre.'})
    } else {
        //HASH PASSWORD
        const hash = bcrypt.hashSync(passwd, 10);

        await pool.query(`INSERT INTO user (username,passwd,address) VALUES ("${username}","${hash}","${address}");`);
        res.status(201).json({message:`Usuario ${username} creado.`});
    }
    //res.send(result[0])
}

export const editUser = async (req,res)=>{
    const { id } = req.params;
    const {username, address, passwd} = req.body;

    const [checkUsername] = await pool.query(`SELECT * FROM user WHERE username = ?`, username);
    if (checkUsername.length > 0 && checkUsername[0].id != id) {
        res.status(409).json({message:'El nombre de usuario ya está en uso, por favor use otro nombre.'})
    }
    else{
        //HASH PASSWORD
        const hash = bcrypt.hashSync(passwd, 10);

        const [result] = await pool.query("SELECT * FROM user WHERE id = ?", id);
        if (result.length == 0){
            res.status(404).json({message:'Usuario no encontrado.'});
        }
        else{
            await pool.query(`UPDATE user SET username="${username}",address="${address}",passwd="${hash}"  WHERE id = ${id}`);
            res.status(201).json({message:'Usuario actualizado'});
        }
    }
}

export const deleteUser = async (req,res)=>{
    //res.send('deleteUser')
    const { id } = req.params;
    const [result] = await pool.query("SELECT username FROM user WHERE id = ?;", id);

    if (result.length > 0){
        await pool.query("DELETE FROM user WHERE id = ?", id);
        res.status(201).json({message:'Usuario '+ result[0].username + ' eliminado'});
    }
    else{
        res.status(404).json({message:'No se ha encontrado el usuario'});
    }
}
