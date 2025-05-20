import redisClient from './client'

export class RedisQueue {
    private static instance: RedisQueue;

    private constructor() {}

    public static getInstance(): RedisQueue {
        if(!RedisQueue.instance){
            RedisQueue.instance = new RedisQueue();
        }
        return RedisQueue.instance;
    }

    // add a chat message into the queue for db writing
    public async addChatMessage(message: {
        message: string,
        roomId: number,
        userId: string
    }): Promise<void> {
        const { redis } = redisClient;
        await redis.lpush('CHAT_QUEUE', JSON.stringify(message));
    }

    // start a worker to process the chat queue
    // this should be in a separate service/process
    public startChatWorker(processFunction: (message: any)=> Promise<void>): void {
        const { redis } = redisClient;

        // every one second the worker checks for a message in the queue
        setInterval(async () => {
            try{
                const messageJson = await redis.rpop('CHAT_QUEUE');

                if(messageJson){
                    const message = JSON.parse(messageJson);
                    await processFunction(message);
                }
            } catch(error){
                console.error("Error processing chat queue: ", error);
            }
        }, 1000);
    }
}