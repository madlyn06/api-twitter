import { UpdateMeBody } from './../models/request/Users.request'
import { usersService } from './../services/users.services'
import { Response, Request, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody, TokenPayLoad } from '~/models/request/Users.request'
import { User } from '~/models/schemas/User.schemas'
import { databaseService } from '~/services/database.services'
import { ObjectId } from 'mongodb'
import { httpStatus } from '~/constant/httpStatus'
import { UserVerifyStatus } from '~/constant/enum'
export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id
  const result = await usersService.login({ user_id: user_id.toString() as string, verify: user.verify })
  return res.json({ message: 'Login success', result })
}
export const loginOauthController = async (req: Request, res: Response) => {
  const { code } = req.query
  const { access_token, refresh_token } = await usersService.oauth(code as string)
  console.log({ access_token, refresh_token })
  const urlRedirect = `http://localhost:3000/login/oauth?access_token=${access_token}&refresh_token=${refresh_token}`
  return res.redirect(urlRedirect)
}
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)
  return res.json({ message: 'Register success', result })
}
export const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  usersService.logout(refresh_token)
  return res.send({ message: 'Logout success' })
}
export const verifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_verify_email_token as TokenPayLoad
  const user = await databaseService.user.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' })
  }
  // Đã verify rồi thì mình sẽ không báo lỗi
  // Mà mình sẽ trả về status OK với message là đã verify trước đó rồi
  if (user.email_verify_token === '') {
    return res.status(httpStatus.OK).json({ message: 'User verified' })
  }
  const result = await usersService.verifyEmail(user_id)
  console.log(result)
  return res.json({ message: 'Verify email success', result })
}
export const ResendEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayLoad
  const user = await databaseService.user.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.status(httpStatus.OK).json({ message: 'User already verified' })
  }
  const result = await usersService.resendEmail(user_id)
  return res.json(result)
}

export const forgotPassWordController = async (req: Request, res: Response) => {
  const { _id } = req.user as User
  const result = await usersService.forgotPassword(_id.toString())
  return res.json(result)
}

export const resetPasswordController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayLoad
  const { password } = req.body
  const result = await usersService.resetPassword(user_id, password)
  return res.json({ message: 'Reset password success' })
}

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayLoad
  const result = await usersService.getMe(user_id)
  return res.json({
    message: 'Get me success',
    result
  })
}
export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeBody>, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayLoad
  const result = await usersService.updateMe(user_id, req.body)
  return res.json({ message: 'Update me success', result })
}
export const getProfileController = async (req: Request, res: Response) => {
  const { username } = req.params
  const result = await usersService.getProfile(username)
  return res.json({
    message: 'Get profile success',
    result
  })
}

export const followController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayLoad
  const { followed_user_id } = req.body
  const result = await usersService.follow(user_id, followed_user_id)
  return res.json({ message: 'Follow success' })
}
export const unFollowController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayLoad
  const { followed_user_id } = req.params
  const result = await usersService.unFollow(user_id, followed_user_id)
  return res.json({ result })
}
export const changePasswordController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayLoad
  const { password } = req.body
  await usersService.changePassword(user_id, password)
  return res.json({ message: 'Change password success' })
}
