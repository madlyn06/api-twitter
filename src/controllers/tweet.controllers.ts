import { databaseService } from '~/services/database.services'
import { TokenPayLoad } from '~/models/request/Users.request'
import { Request, Response } from 'express'
import { tweetsService } from '~/services/tweets.services'
import { ObjectId } from 'mongodb'
import { Tweet } from '~/models/schemas/Tweet.schemas'

export const tweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayLoad
  const result = await tweetsService.createTweet(user_id, req.body)
  res.json({
    message: 'Create tweet success',
    result
  })
}
export const bookmarkController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayLoad
  await tweetsService.bookmarkTweet(new ObjectId(user_id), req.body)
  res.json({
    message: 'Bookmark tweet success'
  })
}
export const unbookmarkController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayLoad
  await tweetsService.unbookmarkTweet(new ObjectId(user_id), new ObjectId(req.params.bookmarkId))
  res.json({
    message: 'Unbookmark tweet success'
  })
}
export const getTweetController = async (req: Request, res: Response) => {
  const tweet = req.tweet as Tweet
  res.json({ message: 'get tweet successfully', result: tweet })
}
export const getTweetChildController = async (req: Request, res: Response) => {
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const tweet_type = Number(req.query.tweet_type)
  const tweets = await tweetsService.getTweetParen({
    tweet_id: new ObjectId(req.params.tweet_id),
    tweet_type,
    page,
    limit
  })
  res.json({
    message: 'get tweet children successfully',
    result: tweets,
    page,
    limit,
    total_page: Math.ceil(page / limit)
  })
}

export const getTweetsNewFeedsController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_access_token as TokenPayLoad
  console.log(req.query.page, req.query.limit)
  const result = await tweetsService.getTweetsNewFeeds({
    user_id: new ObjectId(user_id),
    page: Number(req.query.page),
    limit: Number(req.query.limit)
  })
  res.json({
    message: 'get tweets new feeds successfully',
    result
  })
}
