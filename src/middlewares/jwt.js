import jwt from 'jsonwebtoken';
import SECRET_KEY from '../jwtSecret.js';

export const checkJwt = (req,res,next)=>{
    const token = req.headers['auth'];
    let jwtPayload;
    try {
        jwtPayload = jwt.verify(token, SECRET_KEY.jwtSecret);
        res.locals.jwtPayload = jwtPayload;
    } catch (error) {
        return res.status(401).json({ message: 'No Autorizado' });
    }

    const { userId, username } = jwtPayload;
    const newToken = jwt.sign({ userId: userId, username: username }, SECRET_KEY.jwtSecret, { expiresIn: '1h' });

    res.setHeader('token', newToken);
    next();
}