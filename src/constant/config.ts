import { config } from 'dotenv'
const env = process.env.NODE_ENV
const envFilename = `.env.${env}`
if (!env) {
  console.log(`Bạn chưa cung cấp môi trường NODE_ENV ví dụ: development, production`)
  console.log(`Phát hiện NODE_ENV= ${env}, vì thế app sẽ dùng file môi trường là ${envFilename}`)
  process.exit(1)
}
config({
  path: envFilename
})

export const envConfig = {
  port: process.env.PORT || 4000,
  secret_access_token: process.env.JWT_SECRET_ACCESS_TOKEN as string,
  secret_refresh_token: process.env.JWT_SECRET_REFRESH_TOKEN as string,
  secret_verify_email_token: process.env.JWT_SECRET_VERIFY_EMAIL_TOKEN as string,
  secret_forgot_password_token: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
  db_username: process.env.DB_USERNAME as string,
  db_password: process.env.DB_PASSWORD as string,
  google_client_id: process.env.GOOGLE_CLIENT_ID as string,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
  google_ridirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
  password: process.env.PASSWORD_SECRET as string,
  aws_reion: process.env.AWS_REGION as string,
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY as string,
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID as string,
  ses_from_address: process.env.SES_FROM_ADDRESS as string
}
