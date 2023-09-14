import { Router } from 'express'
import { serveStaticController } from '~/controllers/media.controllers'
const staticRouter = Router()
staticRouter.get('/static/:name', serveStaticController)
export default staticRouter
