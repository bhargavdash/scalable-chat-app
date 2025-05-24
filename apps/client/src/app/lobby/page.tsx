"use client"

import axios from 'axios'
import { useRef } from 'react'
import { HTTP_URL } from '../config';
import { useRouter } from 'next/navigation';

export default function Lobby() {

    const roomRef = useRef<HTMLInputElement>(null);
    const router = useRouter()

    const handleCreateRoom = async() => {
        const roomName = roomRef.current?.value;

        if(!roomName){
            alert("Enter a room name");
            return;
        }
        const response = await axios.post(`${HTTP_URL}/room`, {
            name: roomName
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })

        console.log(response.data)

        // join the user into the created room
        handleJoinRoom();
    }

    const handleJoinRoom = async() => {
        // this is a websocket connection
        // redirect to the room/slug route
        const roomName = roomRef.current?.value;
        router.push(`/room/${roomName}`)
    }

    return <>
    <div className='h-screen w-screen flex items-center justify-center'>
        <div className='border border-dashed p-4 w-80 flex flex-col gap-6'> 
            <div className='flex justify-center items-center'>
                <p className='font-bold text-xl'>Create or Join a room here</p>
            </div>
            <div className='flex flex-col gap-4'>
                <input ref={roomRef} className="h-10 p-2"
                type="text" placeholder="Enter room name" />
                <div className='flex gap-2'>
                    <div onClick={handleCreateRoom}
                    className='hover:cursor-pointer hover:bg-gray-600 w-full bg-gray-700 p-3 flex justify-center items-center rounded-md'>Create room</div>
                    <div onClick={handleJoinRoom}
                    className='hover:cursor-pointer hover:bg-gray-600 w-full bg-gray-700 p-3 flex justify-center items-center rounded-md'>Join room</div>
                </div>
            </div>
        </div>
    </div>
    </>
}