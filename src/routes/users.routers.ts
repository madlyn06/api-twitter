import {
  changePasswordController,
  followController,
  loginOauthController,
  unFollowController
} from './../controllers/users.controllers'
import {
  accessTokenValidator,
  changePasswordValidator,
  followValidator,
  forgotPassWordValidator,
  refreshTokenValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyEmailValidator,
  verifyForgotPassWordValidator
} from './../middlewares/users.middlewares'
import { Router } from 'express'
import {
  forgotPassWordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  registerController,
  ResendEmailController,
  resetPasswordController,
  updateMeController,
  verifyEmailController
} from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/ultils/handlers'
const usersRouter = Router()

usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

usersRouter.get('/oauth/google', wrapRequestHandler(loginOauthController))

usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

usersRouter.post('/verify-email', verifyEmailValidator, wrapRequestHandler(verifyEmailController))

usersRouter.post('/resend-email-verify', accessTokenValidator, wrapRequestHandler(ResendEmailController))

usersRouter.post('/forgot-password', forgotPassWordValidator, wrapRequestHandler(forgotPassWordController))

usersRouter.post(
  '/reset-password',
  resetPasswordValidator,
  verifyForgotPassWordValidator,
  wrapRequestHandler(resetPasswordController)
)
usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  wrapRequestHandler(updateMeController)
)
usersRouter.get('/:username', wrapRequestHandler(getProfileController))
usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)
usersRouter.delete(
  '/:followed_user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(unFollowController)
)
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)
export default usersRouter
