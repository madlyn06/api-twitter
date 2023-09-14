import { upload_dir } from './../constant/dir'
import { NextFunction, Request, Response } from 'express'
import { Fields, Files, File } from 'formidable'
import path from 'path'
import mediaServices from '~/services/medias.services'
import { databaseService } from '~/services/database.services'
import { TokenPayLoad } from '~/models/request/Users.request'
import { ObjectId } from 'mongodb'

export const uploadImagesController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaServices.handleUploadFile(req, 'images')
  return res.json({
    result: url
  })
}
export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaServices.handleUploadFile(req, 'video')
  return res.json({
    result: url
  })
}
export const serveStaticController = (req: Request, res: Response) => {
  const { name } = req.params
  res.sendFile(path.resolve(upload_dir, name))
}
