import { Router } from "express";
import { CreateUserSchema, SignInSchema, CreateRoomSchema } from '@repo/common/types'
import bcrypt from 'bcrypt'
import { userMiddleware, CustomRequest } from "../middleware/userMiddleware";
import {JWT_SECRET} from '@repo/backend-common/config'
import {prismaClient} from '@repo/db/client'
import jwt from 'jsonwebtoken'

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
            const hashedPassword = await bcrypt.hash(parsedData.data.password, 5)
            const user = await prismaClient.user.create({
                data: {
                    email: parsedData.data.username,
                    password: hashedPassword,
                    name: parsedData.data.name
                }
            })
            return res.status(200).json({message: "User created successfully", user: user})
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

        try{
            const user = await prismaClient.user.findFirst({
                where:{
                    email: parsedData.data.username
                }
            })

            if(!user){
                return res.status(400).json({error: "User does not exist"})
            }
            console.log(parsedData.data.password)
            console.log(user.password)
            const matchedPassword = await bcrypt.compare(parsedData.data.password, user.password)
            console.log(matchedPassword)
            if(!matchedPassword){
                return res.status(400).json({error: "Incorrect Password"})
            }

            const token = jwt.sign({
                userId: user.id
            }, JWT_SECRET)

            return res.status(200).json({message: "Signin successful", token: token})
        } catch(e){
            return res.status(400).json({error: e})
        }
    } catch(err){
        return res.status(400).json({error: err})
    }  
})

router.post('/room', userMiddleware, async(req: CustomRequest, res): Promise<any> => {
    try{
        const parsedData = CreateRoomSchema.safeParse(req.body)

        if(!parsedData.success){
            return res.status(400).json({message: "Invalid Inputs"})
        }
 
        const userId = req.userId as string;

        try{
            const room = await prismaClient.room.create({
                data: {
                    slug: parsedData.data.name,
                    adminId: userId
                }
            })
            if(!room){
                return res.status(400).json({error: "Room with this name already exists"})
            }

            return res.status(200).json({message: "Room created!!", room: room})
        } catch(e){
            return res.status(400).json({error: e})
        }  
    } catch(err){
        return res.status(400).json({error: err})
    }
})

router.get('/chats/:roomId', async(req, res): Promise<any> => {
    try{
        const roomId = Number(req.params.roomId)

        const messages = await prismaClient.chat.findMany({
            where:{
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 50
        })
        if(!messages){
            return res.status(400).json({error: "can't fetch messages"})
        }

        return res.status(200).json({messages})
    }catch(e){
        return res.status(400).json({error: e})
    }
})

export default router