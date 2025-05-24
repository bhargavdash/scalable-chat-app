"use client"

import { WS_URL } from "@/app/config";
import { useEffect, useState } from "react"

export function useSocket() {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if(!token){
            alert("Token not found for ws connection")
            return;
        }
        const ws = new WebSocket(`${WS_URL}?token=${token}`);

        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        }

        return () => {
            if(ws){
                ws.close();
            }
        }
    }, []);

    return {socket, loading}
}