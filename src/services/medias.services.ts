import { isProduction, upload_dir, upload_temp_dir } from '~/constant/dir'
import { Request } from 'express'
import sharp from 'sharp'
import { getName, uploadFile } from '~/ultils/file'
import fs from 'fs'
import { MediaType } from '~/constant/enum'
import { File } from 'formidable'
import { databaseService } from './database.services'
import { ObjectId } from 'mongodb'
import { TokenPayLoad } from '~/models/request/Users.request'
class MediaServices {
  async handleUploadFile(req: Request, type: string) {
    if (type === 'images') {
      const { user_id } = req.decoded_access_token as TokenPayLoad

      const files = await uploadFile(req, 'images')
      const total = (files as File[]).map(async (file) => {
        const newName = getName(file.newFilename)
        await sharp(file.filepath).jpeg().toFile(`${upload_dir}/${newName}.jpg`)
        // fs.unlinkSync(file.filepath)
        databaseService.medias.insertOne({
          url: newName + user_id,
          user_id: new ObjectId(user_id)
        })
        return {
          url: isProduction
            ? `http://twitter-clone/static/${newName}.jpg`
            : `http://localhost:3000/static/${newName}.jpg`,
          type: MediaType.Image
        }
      })
      const result = await Promise.all(total)
      return result
    } else if (type === 'video') {
      const files = await uploadFile(req, 'video')
      const newName = (files as File[])[0].newFilename
      return {
        url: isProduction ? `http://twitter-clone/static/${newName}` : `http://localhost:3000/static/${newName}`
      }
    }
  }
}
const mediaServices = new MediaServices()
export default mediaServices
