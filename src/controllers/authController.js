import { pool } from "../db.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import SECRET_KEY from '../jwtSecret.js';

export const login = async (req,res)=>{
    const { username, passwd } = req.body;

    if (!(username && passwd)) {
      return res.status(400).json({ message: 'Nombre de usuario y contraseña requeridos.' });
    }
    const [result] = await pool.query(`SELECT * FROM user WHERE username = "${username}";`);
    if (result.length==0){
        //No se encuentra al usuario
        return res.status(400).json({ message: 'Nombre de usuario o contraseña incorrectos.' });
    }
    else{
        const resultPassword = bcrypt.compareSync(passwd, result[0].passwd);
        if (!resultPassword){
            //contraseña erronea
            return res.status(400).json({ message: 'Nombre de usuario o contraseña incorrectos.' });
        }
        else{
            const token = jwt.sign({ userId: result[0].id, username: result[0].username }, SECRET_KEY.jwtSecret, { expiresIn: '1h' });
            res.send({id: result[0].id, username: result[0].username, token: token, expiresIn: '1h' })
        }
    }
}

export const register = async (req,res)=>{
    const {username, address, passwd} = req.body;

    let [result] = await pool.query(`SELECT * FROM user WHERE username = "${username}" OR address = "${address}"`);
    if (result.length > 0) {
        res.status(409).json({message:'El nombre de usuario y/o Email ya están en uso, por favor revise los datos.'})
    } else {
        //HASH PASSWORD
        const hash = bcrypt.hashSync(passwd, 10);
        //Creación usuario
        await pool.query(`INSERT INTO user (username,passwd,address) VALUES ("${username}","${hash}","${address}");`);
       //Inicio sesión con token generado
        let [result] = await pool.query(`SELECT id, username FROM user WHERE username = "${username}"`)
        
        const token = jwt.sign({ userId: result[0].id, username: result[0].username }, SECRET_KEY.jwtSecret, { expiresIn: '1h' });
        res.status(201).json({id: result[0].id, username: result[0].username, token: token, expiresIn: '1h' })
    }
    //res.send(result[0])
}


// export const changePassword = async (req,res)=>{
//     res.send("changePasswd")
// }