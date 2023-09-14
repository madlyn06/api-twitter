import { RefreshToken } from './../models/schemas/RefreshToken.schemas'
import { RegisterReqBody, UpdateMeBody } from '~/models/request/Users.request'
import { User } from '~/models/schemas/User.schemas'
import { hashPassword } from '~/ultils/crypto'
import { signToken } from '~/ultils/jwt'
import { databaseService } from './database.services'
import { ObjectId } from 'mongodb'
import { config } from 'dotenv'
import { TokenType, UserVerifyStatus } from '~/constant/enum'
import { ErrorWithMessage } from '~/models/Error'
import { httpStatus } from '~/constant/httpStatus'
import axios from 'axios'
import { randomPassword } from '~/ultils/commons'
import { envConfig } from '~/constant/config'
config()
class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      options: { expiresIn: '15m' },
      privateKey: envConfig.secret_access_token
    })
  }
  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      options: { expiresIn: '100d' },
      privateKey: envConfig.secret_refresh_token
    })
  }
  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id },
      options: { expiresIn: '7d' },
      privateKey: envConfig.secret_verify_email_token
    })
  }
  private signForgotPassWordToken(user_id: string) {
    return signToken({
      payload: { user_id },
      options: { expiresIn: '15m' },
      privateKey: envConfig.secret_forgot_password_token
    })
  }
  private signToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ verify, user_id }), this.signRefreshToken({ verify, user_id })])
  }
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId().toString()
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    await databaseService.user.insertOne(
      new User({
        ...payload,
        username: user_id.toString() + 'hehe',
        _id: new ObjectId(user_id),
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const [access_token, refresh_token] = await this.signToken({ user_id, verify: UserVerifyStatus.Unverified })
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    return { access_token, refresh_token }
  }
  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signToken({ user_id, verify })
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )
    return { access_token, refresh_token }
  }
  private async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      client_id: envConfig.google_client_id,
      client_secret: envConfig.google_client_secret,
      redirect_uri: envConfig.google_ridirect_uri,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    const { access_token, id_token } = data
    return { access_token, id_token }
  }
  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }
  async oauth(code: string) {
    const { access_token, id_token } = await this.getOAuthGoogleToken(code)
    const { email, name } = await this.getGoogleUserInfo(access_token, id_token)
    // kiểm tra nếu email đã đăng ký trong db rồi thì sẽ đăng nhập bằng db đó
    const user = await databaseService.user.findOne({ email })
    if (user) {
      const [access_token, refresh_token] = await this.signToken({ user_id: user._id.toString(), verify: user.verify })
      await databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: user._id, token: refresh_token }))
      return { access_token, refresh_token }
    } else {
      const password = randomPassword()
      const body = {
        name,
        email,
        password,
        confirm_password: password,
        date_of_birth: new Date().toISOString()
      }
      const { access_token, refresh_token } = await this.register(body)
      return { access_token, refresh_token }
    }
  }
  async checkEmailExist(email: string) {
    const result = await databaseService.user.findOne({ email })
    return Boolean(result)
  }
  async logout(token: string) {
    await databaseService.refreshTokens.deleteOne({ token })
  }
  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.user.updateOne(
        { _id: new ObjectId(user_id) },
        { $set: { email_verify_token: '', verify: UserVerifyStatus.Verified, updated_at: new Date() } }
      )
    ])
    const [access_token, refresh_token] = token
    return { access_token, refresh_token }
  }
  async resendEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    await databaseService.user.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { email_verify_token, updated_at: new Date() } }
    )
    return { message: 'resend email success' }
  }

  async forgotPassword(user_id: string) {
    const forgot_password_token = await this.signForgotPassWordToken(user_id)
    await databaseService.user.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { forgot_password_token, updated_at: new Date() } }
    )
    console.log(forgot_password_token, ' : forgot_password_token')
    return { message: 'forgot password success' }
  }
  async resetPassword(user_id: string, password: string) {
    await databaseService.user.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(password)
        }
      }
    )
  }
  async getMe(user_id: string) {
    return databaseService.user.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
  }
  async updateMe(user_id: string, body: UpdateMeBody) {
    const result = await databaseService.user.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: body
      },
      {
        returnDocument: 'after',
        projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 }
      }
    )
    return result.value
  }
  async getProfile(username: string) {
    const user = await databaseService.user.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithMessage({ message: 'User not found', status: httpStatus.NOT_FOUND })
    }
    return user
  }
  async follow(user_id: string, followed_user_id: string) {
    const result = await databaseService.followers.findOne({
      followed_user_id: new ObjectId(followed_user_id),
      user_id: new ObjectId(user_id)
    })
    if (!result) {
      return await databaseService.followers.insertOne({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
    }
    throw new ErrorWithMessage({ message: 'User followed', status: httpStatus.BAD_REQUEST })
  }
  async unFollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower) {
      await databaseService.followers.deleteOne({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
      return { message: 'Unfollow success!!' }
    }
    throw new ErrorWithMessage({ message: 'Don"t follow this user', status: httpStatus.BAD_REQUEST })
  }
  async changePassword(user_id: string, password: string) {
    await databaseService.user.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(password)
        }
      }
    )
  }
}
export const usersService = new UsersService()
