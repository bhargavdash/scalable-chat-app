import { Redis } from 'ioredis'

const redis = new Redis()

const pub = new Redis()
const sub = new Redis()

pub.on("connect", () => console.log("Redis Pub client is connected"))
sub.on("connect", () => console.log("Redis Sub client is connected"))

redis.on("connect", () => console.log("Redis Main client is connected"))

export default {redis, pub, sub}