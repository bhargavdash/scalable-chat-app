// this is the server component which gets the previous messages in the room from backend
// it then returns the actual chat room client component where we handle the socket connection

import { HTTP_URL } from "@/app/config";
import axios from "axios";
import { ChatRoomClient } from "./ChatRoomClient";

async function getChats(id: number) {
    const response = await axios.get(`${HTTP_URL}/chats/${id}`);
    
    return response.data.chats;
}

export async function ChatRoomServer({id}: {id: number}) {
    const chats = await getChats(id);

    // return ChatRoomClient component
    return <ChatRoomClient chats={chats} id={id} />
}