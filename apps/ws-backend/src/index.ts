import WebSocket, { WebSocketServer } from "ws";
import jwt from 'jsonwebtoken'
import {JWT_SECRET} from '@repo/backend-common/config'
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({port: 8080})

interface User {
    ws: WebSocket,
    rooms: String[],
    userId: string
}

const users: User[] = []

wss.on('connection', function connection(ws: WebSocket, request){
    try{
        const url = request.url // gives us the url -> ws://localhost:3000?token=123123
    
        if(!url){
            return;
        }
        const queryParams = new URLSearchParams(url.split("?")[1]);
        const token = queryParams.get("token") ?? ""

        const decodedToken = jwt.verify(token, JWT_SECRET) as {userId: string}

        if(!decodedToken || !decodedToken.userId){
            ws.send("Access denied. Token not found")
            ws.close()
            return;
        }
        const userId = decodedToken.userId

        users.push({
            userId,
            rooms:[],
            ws
        })

        ws.on('message', async function message(data: string){
            const parsedData = JSON.parse(data) // {type: "join_room", roomId: 1}

            if(parsedData.type == "join_room"){
                const user = users.find(x => x.ws = ws)
                user?.rooms.push(parsedData.roomId)
                console.log(users)
            }

            if(parsedData.type == "leave_room"){
                const user = users.find(x => x.ws = ws)
                if(!user) return;
                user.rooms = user.rooms.filter(x => x !== parsedData.roomId)
                console.log(users)
            }

            if(parsedData.type == "chat"){
                const roomId = parsedData.roomId;
                const message = parsedData.message

                await prismaClient.chat.create({
                    data: {
                        message,
                        roomId,
                        userId
                    }
                })

                users.map(user => {
                    if(user.rooms.includes(roomId)){
                        user.ws.send(JSON.stringify({
                            type: "chat",
                            message: message,
                            roomId
                        }))
                    }
                })
            }
        })
    } catch(e){
        console.log(e)
    }
});