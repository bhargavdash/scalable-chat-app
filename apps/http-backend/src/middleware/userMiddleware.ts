import { Request, Response, NextFunction } from "express"
import jwt from 'jsonwebtoken'

export interface CustomRequest extends Request {
    userId?: string
}

export const userMiddleware = (req: CustomRequest, res: Response, next: NextFunction): void => {
    try{
        const authToken = req.headers["Authentication"] as string;
        const token = authToken.split(" ")[1]

        if(!token){
            res.status(400).json({error: "Token not found"})
            return;
        }
        const decodedToken = jwt.verify(token, "myjwtsecret") as {userId: string}

        if(!decodedToken){
            res.status(403).json({error: "Authentication Failed!"})
        }
        req.userId = decodedToken.userId;
        next()
    } catch(err){
        res.status(400).json({error: err})
        return;
    }
}