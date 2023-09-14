import { accessTokenValidator, verifiedUserValidator } from './../middlewares/users.middlewares'
import { Router } from 'express'
import { wrapRequestHandler } from '~/ultils/handlers'
import {
  bookmarkController,
  getTweetChildController,
  getTweetController,
  getTweetsNewFeedsController,
  tweetController,
  unbookmarkController
} from '~/controllers/tweet.controllers'
import {
  audienceValidator,
  isUserLoggedInValidator,
  tweetIdValidator,
  tweetValidator
} from '~/middlewares/tweets.middlewares'

const tweetsRouter = Router()

tweetsRouter.post('/', accessTokenValidator, verifiedUserValidator, tweetValidator, wrapRequestHandler(tweetController))

tweetsRouter.post(
  '/bookmark',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarkController)
)

tweetsRouter.delete(
  '/unbookmark/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unbookmarkController)
)

tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

tweetsRouter.get(
  '/:tweet_id/parent',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildController)
)

tweetsRouter.get('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getTweetsNewFeedsController))
export default tweetsRouter
