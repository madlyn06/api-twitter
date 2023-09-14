import path from 'path'
import argv from 'minimist'
const options = argv(process.argv.slice(2))
export const upload_temp_dir = path.resolve('uploads/temp')
export const upload_dir = path.resolve('uploads')
export const isProduction: Boolean = options.production
