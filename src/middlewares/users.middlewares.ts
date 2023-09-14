import { verifyToken } from './../ultils/jwt'
import { Request, Response, NextFunction } from 'express'
import { validate } from '~/ultils/validation'
import { checkSchema } from 'express-validator'
import { usersService } from '~/services/users.services'
import { userMessage } from '~/constant/messageError'
import { databaseService } from '~/services/database.services'
import { hashPassword } from '~/ultils/crypto'
import { ErrorWithMessage } from '~/models/Error'
import { httpStatus } from '~/constant/httpStatus'
import { JsonWebTokenError } from 'jsonwebtoken'
import { TokenPayLoad } from '~/models/request/Users.request'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constant/enum'
import { envConfig } from '~/constant/config'
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: userMessage.EMAIL_IS_REQUIRED
        },
        isEmail: { errorMessage: userMessage.EMAIL_IS_INVALID },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.user.findOne({ email: value, password: hashPassword(req.body.password) })
            req.user = user
            if (user === null) {
              throw new Error(userMessage.NOT_FOUND_ACCOUT)
            }
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: userMessage.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: userMessage.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          errorMessage: userMessage.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
          options: {
            min: 6,
            max: 50
          }
        },
        isStrongPassword: {
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: userMessage.PASSWORD_MUST_BE_STRONG
        }
      }
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: userMessage.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: userMessage.NAME_MUST_BE_A_STRING
        },
        isLength: {
          errorMessage: userMessage.NAME_LENGTH_MUST_BE_FROM_1_TO_100,
          options: {
            min: 1,
            max: 100
          }
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: userMessage.EMAIL_IS_REQUIRED
        },
        isEmail: { errorMessage: userMessage.EMAIL_IS_INVALID },
        trim: true,
        custom: {
          options: async (value) => {
            if (await usersService.checkEmailExist(value)) {
              throw new Error('Email already exist')
            }
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: userMessage.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: userMessage.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          errorMessage: userMessage.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
          options: {
            min: 6,
            max: 50
          }
        },
        isStrongPassword: {
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: userMessage.PASSWORD_MUST_BE_STRONG
        }
      },
      confirm_password: {
        notEmpty: { errorMessage: userMessage.CONFIRM_PASSWORD_IS_REQUIRED },
        isString: { errorMessage: userMessage.CONFIRM_PASSWORD_MUST_BE_A_STRING },
        isLength: {
          errorMessage: userMessage.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
          options: {
            min: 6,
            max: 50
          }
        },
        isStrongPassword: {
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: userMessage.CONFIRM_PASSWORD_MUST_BE_STRONG
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error('Password confirmation does not match password')
            }
            return true
          }
        }
      },
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          },
          errorMessage: userMessage.DATE_OF_BIRTH_MUST_BE_ISO8601
        }
      }
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithMessage({
                status: httpStatus.UNAUTHORIZED,
                message: userMessage.NOT_FOUND_ACCESSTOKEN
              })
            }
            const access_token = value.split(' ')[1]
            if (!access_token)
              throw new ErrorWithMessage({
                status: httpStatus.UNAUTHORIZED,
                message: userMessage.NOT_FOUND_ACCESSTOKEN
              })
            try {
              const decoded_access_token = await verifyToken({
                token: access_token,
                privateKey: envConfig.secret_access_token
              })
              ;(req as Request).decoded_access_token = decoded_access_token
            } catch (error) {
              throw new ErrorWithMessage({
                status: httpStatus.UNAUTHORIZED,
                message: (error as JsonWebTokenError).message
              })
            }
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema({
    refresh_token: {
      trim: true,
      custom: {
        options: async (value, { req }) => {
          if (!value) {
            throw new ErrorWithMessage({
              status: httpStatus.UNAUTHORIZED,
              message: userMessage.NOT_FOUND_REFRESH_TOKEN
            })
          }
          try {
            const [decoded_refresh_token, refresh_token] = await Promise.all([
              verifyToken({ token: value, privateKey: envConfig.secret_refresh_token }),
              databaseService.refreshTokens.findOne({ token: value })
            ])
            ;(req as Request).decoded_refresh_token = decoded_refresh_token
            if (refresh_token === null) {
              throw new ErrorWithMessage({
                message: userMessage.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                status: httpStatus.UNAUTHORIZED
              })
            }
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithMessage({
                status: httpStatus.UNAUTHORIZED,
                message: userMessage.REFRESH_TOKEN_INVALID
              })
            }
            throw error
          }
          return true
        }
      }
    }
  })
)

export const verifyEmailValidator = validate(
  checkSchema({
    email_verify_token: {
      trim: true,
      custom: {
        options: async (value, { req }) => {
          if (!value) {
            throw new ErrorWithMessage({
              status: httpStatus.UNAUTHORIZED,
              message: userMessage.NOT_FOUND_VERIFY_EMAIL
            })
          }
          try {
            const decoded_verify_email = await verifyToken({
              token: value,
              privateKey: envConfig.secret_verify_email_token
            })
            ;(req as Request).decoded_verify_email_token = decoded_verify_email
            console.log(decoded_verify_email)
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithMessage({
                status: httpStatus.UNAUTHORIZED,
                message: error.message
              })
            }
            throw error
          }
          return true
        }
      }
    }
  })
)

export const forgotPassWordValidator = validate(
  checkSchema({
    email: {
      notEmpty: {
        errorMessage: userMessage.EMAIL_IS_REQUIRED
      },
      isEmail: { errorMessage: userMessage.EMAIL_IS_INVALID },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.user.findOne({ email: value })
          if (user === null) {
            throw new Error(userMessage.NOT_FOUND_ACCOUT)
          }
          req.user = user
          return true
        }
      }
    }
  })
)

export const verifyForgotPassWordValidator = validate(
  checkSchema({
    forgot_password_token: {
      trim: true,
      custom: {
        options: async (value, { req }) => {
          if (!value) {
            console.log(value)
            throw new ErrorWithMessage({
              status: httpStatus.UNAUTHORIZED,
              message: userMessage.NOT_FOUND_FORGOT_PASSWORD_TOKEN
            })
          }
          try {
            const decoded_forgot_password_token = await verifyToken({
              token: value,
              privateKey: envConfig.secret_forgot_password_token
            })
            const { user_id } = decoded_forgot_password_token
            const user = await databaseService.user.findOne({ _id: new ObjectId(user_id) })
            if (user === null) {
              throw new ErrorWithMessage({
                message: userMessage.USER_NOT_FOUND,
                status: httpStatus.UNAUTHORIZED
              })
            }
            if (user.forgot_password_token !== value) {
              throw new ErrorWithMessage({
                message: userMessage.FORGOT_PASSWORD_TOKEN_INVALID,
                status: httpStatus.UNAUTHORIZED
              })
            }
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithMessage({
                status: httpStatus.UNAUTHORIZED,
                message: error.message
              })
            }
            throw error
          }
        }
      }
    }
  })
)
export const resetPasswordValidator = validate(
  checkSchema({
    password: {
      notEmpty: {
        errorMessage: userMessage.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: userMessage.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        errorMessage: userMessage.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
        options: {
          min: 6,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: userMessage.PASSWORD_MUST_BE_STRONG
      }
    },
    confirm_password: {
      notEmpty: { errorMessage: userMessage.CONFIRM_PASSWORD_IS_REQUIRED },
      isString: { errorMessage: userMessage.CONFIRM_PASSWORD_MUST_BE_A_STRING },
      isLength: {
        errorMessage: userMessage.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
        options: {
          min: 6,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: userMessage.CONFIRM_PASSWORD_MUST_BE_STRONG
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password')
          }
          return true
        }
      }
    },
    forgot_password_token: {
      trim: true,
      custom: {
        options: async (value, { req }) => {
          if (!value) {
            console.log(value)
            throw new ErrorWithMessage({
              status: httpStatus.UNAUTHORIZED,
              message: userMessage.NOT_FOUND_FORGOT_PASSWORD_TOKEN
            })
          }
          try {
            const decoded_forgot_password_token = await verifyToken({
              token: value,
              privateKey: envConfig.secret_forgot_password_token
            })
            ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
            const { user_id } = decoded_forgot_password_token
            const user = await databaseService.user.findOne({ _id: new ObjectId(user_id) })
            if (user === null) {
              throw new ErrorWithMessage({
                message: userMessage.USER_NOT_FOUND,
                status: httpStatus.UNAUTHORIZED
              })
            }
            if (user.forgot_password_token !== value) {
              throw new ErrorWithMessage({
                message: userMessage.FORGOT_PASSWORD_TOKEN_INVALID,
                status: httpStatus.UNAUTHORIZED
              })
            }
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithMessage({
                status: httpStatus.UNAUTHORIZED,
                message: error.message
              })
            }
            throw error
          }
        }
      }
    }
  })
)
export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_access_token as TokenPayLoad

  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithMessage({
        status: httpStatus.FORBIDDEN,
        message: userMessage.NOT_VERIFIED
      })
    )
  }
  return next()
}
export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        optional: true,
        isString: {
          errorMessage: userMessage.NAME_MUST_BE_A_STRING
        },
        isLength: {
          errorMessage: userMessage.NAME_LENGTH_MUST_BE_FROM_1_TO_100,
          options: {
            min: 1,
            max: 100
          }
        },
        trim: true
      },
      date_of_birth: {
        optional: true,
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          },
          errorMessage: userMessage.DATE_OF_BIRTH_MUST_BE_ISO8601
        },
        trim: true
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: userMessage.BIO_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: userMessage.BIO_LENGTH
        }
      },
      location: {
        optional: true,
        isString: {
          errorMessage: userMessage.LOCATION_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: userMessage.LOCATION_LENGTH
        }
      },
      website: {
        optional: true,
        isString: {
          errorMessage: userMessage.WEBSITE_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: userMessage.WEBSITE_LENGTH
        }
      },
      username: {
        optional: true,
        isString: {
          errorMessage: userMessage.USERNAME_MUST_BE_STRING
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.user.findOne({ username: value })
            if (user === null) {
              return true
            }
            throw new ErrorWithMessage({ message: 'Username already exists', status: httpStatus.BAD_REQUEST })
          }
        },
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: userMessage.USERNAME_LENGTH
        }
      },
      avatar: {
        optional: true,
        isString: {
          errorMessage: userMessage.IMAGE_URL_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 400
          },
          errorMessage: userMessage.IMAGE_URL_LENGTH
        }
      },
      cover_photo: {
        optional: true,
        isString: {
          errorMessage: userMessage.IMAGE_URL_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 400
          },
          errorMessage: userMessage.IMAGE_URL_LENGTH
        }
      }
    },
    ['body']
  )
)
export const followValidator = validate(
  checkSchema({
    followed_user_id: {
      custom: {
        options: async (value, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithMessage({
              status: httpStatus.NOT_FOUND,
              message: userMessage.INVALID_ID
            })
          }
          const user = await databaseService.user.findOne({ _id: new ObjectId(value) })

          if (!user) {
            throw new ErrorWithMessage({
              status: httpStatus.NOT_FOUND,
              message: userMessage.USER_NOT_FOUND
            })
          }
        }
      }
    }
  })
)
export const unfollowValidator = validate(
  checkSchema({
    followed_user_id: {
      custom: {
        options: async (value, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithMessage({
              status: httpStatus.NOT_FOUND,
              message: userMessage.INVALID_ID
            })
          }
          const user = await databaseService.user.findOne({ _id: new ObjectId(value) })

          if (!user) {
            throw new ErrorWithMessage({
              status: httpStatus.NOT_FOUND,
              message: userMessage.USER_NOT_FOUND
            })
          }
        }
      }
    }
  })
)
export const changePasswordValidator = validate(
  checkSchema({
    password: {
      notEmpty: {
        errorMessage: userMessage.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: userMessage.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        errorMessage: userMessage.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
        options: {
          min: 6,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: userMessage.PASSWORD_MUST_BE_STRONG
      }
    },
    confirm_password: {
      notEmpty: { errorMessage: userMessage.CONFIRM_PASSWORD_IS_REQUIRED },
      isString: { errorMessage: userMessage.CONFIRM_PASSWORD_MUST_BE_A_STRING },
      isLength: {
        errorMessage: userMessage.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
        options: {
          min: 6,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: userMessage.CONFIRM_PASSWORD_MUST_BE_STRONG
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password')
          }
          return true
        }
      }
    },
    old_password: {
      notEmpty: {
        errorMessage: userMessage.PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: userMessage.PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        errorMessage: userMessage.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
        options: {
          min: 6,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: userMessage.PASSWORD_MUST_BE_STRONG
      },
      custom: {
        options: async (value, { req }) => {
          const { user_id } = req.decoded_access_token as TokenPayLoad
          const user = await databaseService.user.findOne({ _id: new ObjectId(user_id) })
          if (!user) {
            throw new ErrorWithMessage({ message: userMessage.USER_NOT_FOUND, status: httpStatus.UNAUTHORIZED })
          }
          if (hashPassword(value) !== user.password) {
            throw new ErrorWithMessage({ message: userMessage.PASSWORD_INCORRECT, status: httpStatus.UNAUTHORIZED })
          }
          return true
        }
      }
    }
  })
)
