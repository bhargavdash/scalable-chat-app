import WebSocket from "ws";

interface User {
    userId: string,
    rooms: number[]
}

export class UserStore {
    // creates a single instance of the class 
    private static instance: UserStore;
    // actual data structure to store local state
    private userMap: Map<WebSocket, User> = new Map()

    // made private for singleton architecture
    private constructor() {}

    // a service can call this function to get the instance of this class
    public static getInstance(): UserStore {
        if(!UserStore.instance){
            UserStore.instance = new UserStore()
        }
        return UserStore.instance;
    }

    // add a new user connection
    public addUser(ws: WebSocket, user: User): void{
        this.userMap.set(ws, user)
    }

    // get user info from a websocket connection
    public getUser(ws: WebSocket): User | undefined {
        return this.userMap.get(ws)
    }

    // remove a user connection
    public removeUser(ws: WebSocket): void {
        this.userMap.delete(ws)
    }

    // get all local users to this server
    public getAllUsers(): Map<WebSocket, User> {
        return this.userMap;
    }

    // get websocket connections of all users in a room
    public getConnectionsInRoom(roomId: number): WebSocket[] {
        const connections: WebSocket[] = []

        for(const [ws, user] of this.userMap.entries()){
            if(user.rooms.includes(roomId)){
                connections.push(ws)
            }
        }
        return connections;
    }

    // get number of active connections
    public size(): number {
        return this.userMap.size
    }

    // add a room to user's joined rooms
    public addRoomToUser(ws: WebSocket, roomId: number): boolean {
        const user = this.getUser(ws);
        if(!user) return false;

        if(user.rooms.includes(roomId)){
            return false; // user is already in that room
        }

        user.rooms.push(roomId)
        return true;
    }

    // remove a room from user's joined rooms
    public removeRoomFromUser(ws: WebSocket, roomId: number): boolean {
        const user = this.getUser(ws)
        if(!user) return false;

        const initialLength = user.rooms.length;
        user.rooms = user.rooms.filter(id => id !== roomId)

        // if room is not removed then the below is true and we return false
        return user.rooms.length !== initialLength
    }
}
