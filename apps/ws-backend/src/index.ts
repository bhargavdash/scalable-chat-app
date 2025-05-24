import WebSocket, { WebSocketServer } from "ws";
import jwt from 'jsonwebtoken'
import {JWT_SECRET} from '@repo/backend-common/config'
import { prismaClient } from "@repo/db/client";
import { UserStore } from "./UserStore";
import { RedisManager } from "./redis/RedisManager";
import { RedisQueue } from "./redis/RedisQueue";

const wss = new WebSocketServer({port: 8080})

const localStore = UserStore.getInstance();
const redisManager = RedisManager.getInstance();
const redisQueue = RedisQueue.getInstance();

// start the chat worker for async message processing 
redisQueue.startChatWorker(async(chatData) => {
    try{
        await prismaClient.chat.create({
            data: {
                message: chatData.message,
                roomId: chatData.roomId,
                userId: chatData.userId
            }
        });
        console.log(`Chat message saved to DB: ${chatData.message}`);
    } catch(err){
        console.error('Error saving chat to DB: ', err);
    }
})

// handle incoming chat messages from other servers
redisManager.setMessageHandler((roomId: number, messageData: any) => {
    // find local connections in this room and forward the message
    const localConnections = localStore.getConnectionsInRoom(roomId);

    for (const ws of localConnections){
        ws.send(JSON.stringify({
            type: "chat",
            roomId: messageData.roomId,
            message: messageData.message,
            userId: messageData.userId
        }));
    }
});

// websocket connection handler
wss.on('connection', function connection(ws: WebSocket, request){
    try{
        const url = request.url // gives us the url -> ws://localhost:3000?token=123123
    
        if(!url){
            return;
        }
        const queryParams = new URLSearchParams(url.split("?")[1]);
        const token = queryParams.get("token") ?? ""

        if(!token){
            ws.send(JSON.stringify({
                type: "message",
                payload: "Token not found"
            }))
            ws.close()
            return;
        }

        const decodedToken = jwt.verify(token, JWT_SECRET) as {userId: string}

        if(!decodedToken || !decodedToken.userId){
            ws.send(JSON.stringify({
                type: "message",
                payload: "Access denied"
            }))
            ws.close()
            return;
        }
        const userId = decodedToken.userId
        
        localStore.addUser(ws, {
            userId,
            rooms: []
        })

        console.log("user connected, total: ", localStore.size())

        ws.on('message', async function message(data: string){
            try {
                const parsedData = JSON.parse(data) // {type: "join_room", roomId: 1}

                switch(parsedData.type) {
                    case "join_room": {
                        const roomId = parsedData.roomId;

                        // check if room exists in DB
                        const room = await prismaClient.room.findFirst({
                            where: {id: roomId}
                        })

                        if(!room){
                            ws.send(JSON.stringify({
                                type: "message",
                                payload: "This room does not exist"
                            }))
                            return;
                        }

                        const user = localStore.getUser(ws);
                        if(user?.rooms.includes(roomId)){
                            ws.send(JSON.stringify({
                                type: "message",
                                payload: "You have already joined this room"
                            }))
                            return;
                        }
                        
                        // add room to local store
                        localStore.addRoomToUser(ws, roomId);

                        // publish to redis for global state
                        redisManager.publishUserJoinedRoom(userId, roomId);

                        ws.send(JSON.stringify({
                                type: "message",
                                payload: `You have joined room: ${roomId}`
                            }))
                        break;
                    }

                    case "leave_room": {
                        const roomId = parsedData.roomId;

                        // remove locally
                        const success = localStore.removeRoomFromUser(ws, roomId);
                        if(!success) return;

                        // publish to redis for global state
                        redisManager.publishUserLeftRoom(userId, roomId);

                        ws.send(JSON.stringify({
                                type: "message",
                                payload: `You have left room: ${roomId}`
                            }))
                        break;
                    }

                    case "chat": {
                        const roomId = parsedData.roomId;
                        const message = parsedData.message;

                        // check if user is in the room
                        const user = localStore.getUser(ws);
                        if(!user || !user.rooms.includes(roomId)){
                            ws.send(JSON.stringify({
                                type: "message",
                                payload: "You are not in this room"
                            }))
                            return;
                        }

                        // create message object
                        const messageObject = {
                            type: "chat",
                            userId,
                            roomId,
                            message,
                            timeStamp: Date.now()
                        };

                        // add to async queue for DB storage
                        await redisQueue.addChatMessage({
                            message,
                            roomId,
                            userId
                        })

                        // send to all local users in the room
                        const localConnections = localStore.getConnectionsInRoom(roomId);
                        for (const connection of localConnections){
                            connection.send(JSON.stringify(messageObject));
                        };

                        // publish to Redis for other servers
                        redisManager.publishChatMessage(roomId, messageObject);
                        break;
                    }
                }
            } catch(err){
                console.error("Error processing message: ", err);
                ws.send(JSON.stringify({
                    type: "message",
                    payload: "Error processing your message"
                }))
            }     
        });

        // disconnect handler 
        ws.on("close", () =>{
            const user = localStore.getUser(ws);

            if(user){
                // get rooms before removing user 
                const userRooms = [...user.rooms];

                // remove the user from local store
                localStore.removeUser(ws);

                // publish the event in redis
                for (const roomId of userRooms){
                    redisManager.publishUserLeftRoom(userId, roomId);
                }
            }
            console.log("user disconnected, total: ", localStore.size());
        })
    } catch(e){
        console.error("Connection error: ", e);
        ws.close();
    }
});

console.log("WebSocket server started on port 8080");
