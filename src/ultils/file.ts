import { NextFunction, Request, Response } from 'express'
import { Fields, File, Files } from 'formidable'
import path from 'path'
import fs from 'fs'
import { upload_dir, upload_temp_dir } from '~/constant/dir'
export const initFolder = () => {
  if (!fs.existsSync(upload_temp_dir)) {
    fs.mkdirSync(upload_temp_dir, {
      recursive: true
    })
  }
}
export const getName = (name: string) => {
  return name.split('.')[0]
}
export const uploadFile = async (req: Request, type: string) => {
  const formidable = (await import('formidable')).default
  if (type === 'images') {
    const form = formidable({
      uploadDir: path.resolve(upload_temp_dir),
      keepExtensions: true,
      maxFiles: 4,
      maxFileSize: 1024 * 30 * 40, // 40MB
      filter: ({ name, originalFilename, mimetype }) => {
        const valid: boolean = name === 'image' && Boolean(mimetype && mimetype.includes('image'))

        if (!valid) {
          form.emit('error' as any, new Error('Invalid file type') as any)
        }
        return valid
      }
    })
    return new Promise<File[]>((resolve, reject) => {
      form.parse(req, (err, fields: Fields, files: Files) => {
        if (err) {
          return reject(err)
        }
        console.log(Boolean(files.image))
        if (!Boolean(files.image)) return reject(new Error('File is not empty'))

        resolve(files.image as File[])
      })
    })
  } else if (type === 'video') {
    const form = formidable({
      uploadDir: path.resolve(upload_dir),
      keepExtensions: true,
      maxFiles: 1,
      maxFileSize: 1024 * 1024 * 30 // 40MB
      // filter: ({ name, originalFilename, mimetype }) => {
      //   const valid = name === 'video' && Boolean(mimetype && mimetype.includes('image'))
      //   if (!valid) {
      //     form.emit('error' as any, new Error('Invalid file type') as any)
      //   }
      //   return valid
      // }
    })
    return new Promise<File[]>((resolve, reject) => {
      form.parse(req, (err, fields: Fields, files: Files) => {
        if (err) {
          return reject(err)
        }
        // if (!Boolean(files.image)) return reject(new Error('File is not empty'))
        resolve(files.video as File[])
      })
    })
  }
}
