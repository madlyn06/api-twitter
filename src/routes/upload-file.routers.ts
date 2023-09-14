import { accessTokenValidator, verifiedUserValidator } from './../middlewares/users.middlewares'
import { Router } from 'express'
import { uploadImagesController, uploadVideoController } from '~/controllers/media.controllers'
import { wrapRequestHandler } from '~/ultils/handlers'
const mediaRouter = Router()
mediaRouter.post('/images', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(uploadImagesController))
mediaRouter.post('/video', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(uploadVideoController))
export default mediaRouter
