import { Router } from "express";
import { CreateUserSchema, SignInSchema, CreateRoomSchema } from '@repo/common/types'
import bcrypt from 'bcrypt'
import { userMiddleware, CustomRequest } from "../middleware/userMiddleware";
import {JWT_SECRET} from '@repo/backend-common/config'
import { prismaClient } from "@repo/db/client";

const router  = Router()

router.get("/healthy", (req, res) => {
    res.send("user route is healthy")
})


router.post('/signup', async(req, res): Promise<any> => {
    try{
        const parsedData = CreateUserSchema.safeParse(req.body)

        if(!parsedData.success){
            return res.status(400).json({message: "Invalid Inputs"})
        }
        try{
            await prismaClient.user.create({
                data: {
                    email: parsedData.data.username,
                    password: parsedData.data.password,
                    name: parsedData.data.name
                }
            })
        } catch(e){
            return res.status(411).json({message: "user already exists"})
        }
        

    } catch(err){
        return res.status(400).json({error: err})
    }
})


router.post("/signin", async(req, res): Promise<any> => {
    try{
        const parsedData = SignInSchema.safeParse(req.body)

        if(!parsedData.success){
            return res.status(400).json({message: "Invalid Inputs"})
        }

        const {username, password} = req.body()

        // DB call to retrieve user 
        // match password
        // add jwt token 
    } catch(err){
        return res.status(400).json({error: err})
    }  
})

router.post('/create-room', userMiddleware, async(req: CustomRequest, res): Promise<any> => {
    try{
        const parsedData = CreateRoomSchema.safeParse(req.body)

        if(!parsedData.success){
            return res.status(400).json({message: "Invalid Inputs"})
        }
 
        const userId = req.userId;

        const roomId = crypto.randomUUID()

        
    } catch(err){
        return res.status(400).json({error: err})
    }
})

export default router