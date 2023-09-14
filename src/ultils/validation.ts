import express from 'express'
import { validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { httpStatus } from '~/constant/httpStatus'
import { EntityError, ErrorWithMessage } from '~/models/Error'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validation.run(req)

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const errorObj = errors.mapped()
    const entityError = new EntityError({ error: {} })
    for (const key in errorObj) {
      const { msg } = errorObj[key]
      if (msg instanceof ErrorWithMessage && msg.status !== httpStatus.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      entityError.error[key] = errorObj[key]
    }
    console.log(entityError)
    next(entityError)
  }
}
