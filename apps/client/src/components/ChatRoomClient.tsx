"use client"

import { useSocket } from "@/hooks/useSocket"
import { useEffect, useState, useRef } from "react";
import ChatBox from "./ChatBox";
import {jwtDecode} from 'jwt-decode'
import { useRouter } from "next/navigation";

function getUserId(): string {
    const token = localStorage.getItem("token");
    if(token){
        const decoded = jwtDecode<{userId: string}>(token);
        console.log(decoded.userId);
        return decoded.userId;
    }
    return "";
}

interface Message {
    message: string,
    roomId: number,
    userId: string
}

export function ChatRoomClient({chats, id} : {
    chats: Message[],
    id: number
}){
    const {socket, loading} = useSocket();

    const [messages, setMessages] = useState<Message[]>(chats)

    const [currentMessage, setCurrentMessage] = useState("");

    const chatEndRef = useRef<HTMLDivElement>(null);

    const [userId, setUserId] = useState("");

    const router = useRouter()

    useEffect(() => {
        setUserId(getUserId());
    }, [])


    const scrollToEnd = () => {
        chatEndRef.current?.scrollIntoView({behavior: "smooth"})
    }

    useEffect(() => {
        scrollToEnd()
    }, [messages])

    useEffect(() => {
        if(socket && !loading){
            // send join message to room
            socket.send(JSON.stringify({
                type: "join_room",
                roomId: id
            }))

            // start listening for messages 
            socket.onmessage = (e) => {
                const parsedData = JSON.parse(e.data);
                if(parsedData.type === 'chat'){
                    setMessages((prev) => [...prev, {
                        message: parsedData.message,
                        roomId: id,
                        userId: parsedData.userId
                    }])
                }   
            }

            return () => {
                if(socket){
                    socket.onmessage = null;
                }
            }
        }
    }, [socket, loading, id])

    const handleSendMessage = async() => {
        // send message to websocket server
        if(currentMessage === ''){
            alert("Message field is empty!!");
            return;
        }
        const messageObject = {
            type: "chat",
            message: currentMessage,
            roomId: id
        }
        socket?.send(JSON.stringify(messageObject));
        setCurrentMessage('')
    }

    return <>
    <div className="h-screen w-screen flex flex-col justify-center items-center">
        <div className='font-bold text-xl mx-auto'>Welcome to chat room</div>
        <div className='flex flex-col justify-between gap-4 border border-dashed w-[80%] h-[80%] p-3'>
            <div className='overflow-y-auto flex flex-col gap-3 p-2'>
                {messages.map((msg, index) => {
                    return <ChatBox key={index} 
                    message={msg.message} 
                    userId={msg.userId} 
                    toRight={userId === msg.userId}
                    />
                })}
                <div ref={chatEndRef}></div>
            </div>
            <div className='flex gap-2 items-center'>
                <input onKeyDown={(e) => {
                    if(e.key === "Enter"){
                        handleSendMessage()
                    }
                }}
                 value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)}
                className='p-2 w-full' type="text" placeholder="Enter your message here" />
                <div onClick={handleSendMessage} 
                className='bg-gray-700 p-3 w-28 flex justify-center items-center hover:cursor-pointer hover:bg-gray-600 rounded-md' >Send</div>
            </div>
        </div>
        <div onClick={() => {
            socket?.send(JSON.stringify({
                type: 'leave_room',
                roomId: id
            }))
            router.push('/lobby')
        }}
        className="bg-red-500 text-black hover:cursor-pointer hover:bg-red-400 p-2 flex justify-center items-center rounded-md mt-5 ml-auto mr-20">Leave Room</div>
    </div>
    </>
}
