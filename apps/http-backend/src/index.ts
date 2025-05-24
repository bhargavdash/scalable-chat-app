import express from 'express'
import router from './routes/userRoute'
import cors from 'cors'
const app = express()

app.use(express.json())
app.use(cors())

app.get("/healthy", (req, res) => {
    res.send("Main route is healthy")
})

app.use("/user", router)

app.listen(3001, () => {
    console.log("Http Server running on port 3001")
})