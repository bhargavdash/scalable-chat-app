import redisClient from './client'

// manager global state synchronization across multiple ws servers

export class RedisManager {
    // create an instance 
    private static instance: RedisManager;

    // we create 2 data structures as global state

    // 1. roomMembership maps -> roomId => set of users 
    private roomMembership: Map<number, Set<string>> = new Map()

    // 2. userSessions maps -> userId => set of rooms
    private userSessions: Map<string, Set<number>> = new Map()

    private constructor(){
        this.initializeSubscriptions()
    }

    public static getInstance(): RedisManager {
        if(!RedisManager.instance){
            RedisManager.instance = new RedisManager();
        }
        return RedisManager.instance;
    }

    // set up pub/sub event listeners
    private initializeSubscriptions(): void {
        const { sub } = redisClient;

        // subscribe to join_room and leave_room event
        sub.subscribe('USER_JOINED_ROOM', 'USER_LEFT_ROOM')

        sub.on('message', (channel: string, message: string) => {
            const data = JSON.parse(message);

            switch(channel) {
                case 'USER_JOINED_ROOM':
                    this.handleUserJoinedRoom(data.userId, data.roomId);
                    break;
                case 'USER_LEFT_ROOM':
                    this.handleUserLeftRoom(data.userId, data.roomId);
                    break;
            }
        });

        sub.psubscribe('CHAT:*');

        sub.on('message', (_pattern: string, channel: string, message: string) => {
            if(channel.startsWith('CHAT:')){
                const roomId = parseInt(channel.split(':')[1]!.toString());
                const messageData = JSON.parse(message);
                this.handleChatMessage(roomId, messageData);
            }
        });
    }

    // handler for when a user joins a room
    private handleUserJoinedRoom(userId: string, roomId: number): void {
        // add user into the room storage
        if(!this.roomMembership.has(roomId)){
            this.roomMembership.set(roomId, new Set())
        }
        this.roomMembership.get(roomId)!.add(userId)

        // add room into the user storage
        if(!this.userSessions.has(userId)){
            this.userSessions.set(userId, new Set());
        }
        this.userSessions.get(userId)!.add(roomId)
    }

    // handler for when a user leaves a room
    private handleUserLeftRoom(userId: string, roomId: number): void {
        // remove the user from the room storage
        if(this.roomMembership.has(roomId)){
            this.roomMembership.get(roomId)!.delete(userId)

            // clean up empty rooms
            if(this.roomMembership.get(roomId)!.size === 0){
                this.roomMembership.delete(roomId);
            }
        }

        // remove room from user storage
        if(this.userSessions.has(userId)){
            this.userSessions.get(userId)!.delete(roomId)

            // delete empty users with no sessions
            if(this.userSessions.get(userId)!.size === 0){
                this.userSessions.delete(userId)
            }
        }
    }

    // method to publish a user joining a room
    public publishUserJoinedRoom(userId: string, roomId: number): void {
        const { pub } = redisClient;
        pub.publish('USER_JOINED_ROOM', JSON.stringify({userId, roomId}))

        // update local 
        this.handleUserJoinedRoom(userId, roomId)
    }

    // method to publish a user left a room
    public publishUserLeftRoom(userId: string, roomId: number): void {
        const { pub } = redisClient;
        pub.publish('USER_LEFT_ROOM', JSON.stringify({userId, roomId}));

        // handle local
        this.handleUserLeftRoom(userId, roomId);
    }

    // message handler callback
    private messageHandler: ((roomId: number, message:any) => void) | null = null;

    // callback function to handle incoming messages 
    public setMessageHandler(handler: (roomId: number, message: any) => void): void {
        this.messageHandler = handler
    }

    // handler for incoming chat messages from Redis
    private handleChatMessage(roomId: number, message: any): void {
        if(this.messageHandler){
            this.messageHandler(roomId, message);
        }
    }

    // method to publish a chat message
    public publishChatMessage(roomId: number, message: any): void {
        const { pub } = redisClient;
        pub.publish(`CHAT:${roomId}`, JSON.stringify(message))
    }

    // get all users in a room
    public getUsersInRoom(roomId: number): Set<string> {
        return this.roomMembership.get(roomId) || new Set();
    }

    // get all rooms a user is in
    public getRoomsForUser(userId: string): Set<number> {
        return this.userSessions.get(userId) || new Set();
    }

    // check if a user is in a room
    public isUserInRoom(userId: string, roomId: number): boolean {
        const roomUsers = this.roomMembership.get(roomId)
        return roomUsers ? roomUsers.has(userId) : false;
    }
}

