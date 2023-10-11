import { upload_dir } from './constant/dir'
import express, { NextFunction, Request, Response } from 'express'
import { httpStatus } from './constant/httpStatus'
import { ErrorWithMessage } from './models/Error'
import mediaRouter from './routes/upload-file.routers'
import usersRouter from './routes/users.routers'
import { databaseService } from './services/database.services'
import { omit } from 'lodash'
import { initFolder } from './ultils/file'
import staticRouter from './routes/serve.routers'
import tweetsRouter from './routes/tweets.routers'
import { createServer } from 'http'
import { Server } from 'socket.io'
import helmet from 'helmet'
import { envConfig } from './constant/config'
const app = express()
app.use(helmet())
const httpServer = createServer(app)
const port = envConfig.port
databaseService.connect().catch(console.dir)
app.use(express.json())
app.use('/users', usersRouter)
app.use('/medias', mediaRouter)
app.use('/tweets', tweetsRouter)
app.use('/', staticRouter)
// app.use('/static', express.static(upload_dir))
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithMessage) {
    return res.status(err.status).json(err)
  }
  // Object.getOwnPropertyNames(err).forEach((key) => {
  //   Object.defineProperty(err, key, { enumerable: true })
  // })
  res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: err // omit(err, ['stack'])
  })
})
initFolder()

const io = new Server(httpServer, {
  /* options */
  cors: {
    origin: '*',
  }
})

io.on('connection', (socket) => {
  console.log(`${socket.id} conected`)
  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`)
  })
})

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
