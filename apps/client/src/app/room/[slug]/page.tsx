// this is where the user lands when he creates/joins a room with a slug/room name entered
// this server component retrieves the roomId from the slug entered and passes it to the chat room 
// server component to get the messages 

import { HTTP_URL } from "@/app/config";
import { ChatRoomServer } from "@/components/ChatRoomServer";
import axios from "axios";

async function getRoomId(slug: string) {
    const response = await axios.get(`${HTTP_URL}/room/${slug}`);

    if(response.status === 400){
        alert("Room does not exist");
        return;
    }

    return response.data.id;
}

export default async function ChatRoom({params}: {params: {slug: string}}) {

    const slug = (await params).slug;
    const roomId = await getRoomId(slug)
    if(!roomId){
        return;
    }

    // return ChatRoomServer component
    return <ChatRoomServer id={roomId} />
}