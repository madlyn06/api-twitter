import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constant/enum'

export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}
export interface TokenPayLoad extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
}
export interface UpdateMeBody {
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}
