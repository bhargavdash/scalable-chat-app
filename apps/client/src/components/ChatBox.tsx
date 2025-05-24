export default function ChatBox({message, userId, toRight}: {
    message: string,
    userId: string,
    toRight: boolean
}) {
    return <>
    <div className={`bg-gray-900 rounded-sm w-fit p-2 ${toRight ? "ml-auto" : "mr-auto"}`}>
        <p className='text-gray-600'>{userId}</p>
        <p>{message}</p>
    </div>
    </>
}