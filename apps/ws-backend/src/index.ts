import { WebSocketServer } from "ws";
import jwt from 'jsonwebtoken'
import {JWT_SECRET} from '@repo/backend-common/config'

const wss = new WebSocketServer({port: 8080})

wss.on('connection', function connection(ws, request){
    const url = request.url // gives us the url -> ws://localhost:3000?token=123123
    if(!url){
        return;
    }
    const queryParams = new URLSearchParams(url.split("?")[1]);
    const token = queryParams.get("token") ?? ""

    const decodedToken = jwt.verify(token, JWT_SECRET) as {userId: string}

    if(!decodedToken || decodedToken.userId){
        ws.close()
        return;
    }


    ws.on('message', function message(data){
        ws.send('pong')
    })
    
});