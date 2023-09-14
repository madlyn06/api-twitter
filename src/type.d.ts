import { User } from './models/schemas/User.schemas'
import { Request } from 'express'
import { TokenPayLoad } from './models/request/Users.request'
import { Tweet } from './models/schemas/Tweet.schemas'
declare module 'express' {
  interface Request {
    user?: User
    decoded_access_token?: TokenPayLoad
    decoded_refresh_token?: TokenPayLoad
    decoded_verify_email_token?: TokenPayLoad
    decoded_forgot_password_token?: TokenPayLoad
    tweet?: Tweet
  }
}
