import { databaseService } from '~/services/database.services'
import { ObjectId } from 'mongodb'
import { checkSchema } from 'express-validator'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constant/enum'
import { convertEnumToArray } from '~/ultils/commons'
import { validate } from './../ultils/validation'
import { ErrorWithMessage } from '~/models/Error'
import { httpStatus } from '~/constant/httpStatus'
import { NextFunction, Request, Response } from 'express'
import { Tweet } from '~/models/schemas/Tweet.schemas'
import { userMessage } from '~/constant/messageError'
import { wrapRequestHandler } from '~/ultils/handlers'
const tweetType = convertEnumToArray(TweetType)
const tweetAudience = convertEnumToArray(TweetAudience)
const mediaTypes = convertEnumToArray(MediaType)
export const tweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetType],
        errorMessage: 'type must be Tweet, Retweet, Comment, QuoteTweet'
      }
    },
    audience: {
      isIn: {
        options: [tweetAudience],
        errorMessage: 'audience must be Everyone, TwitterCircle'
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error('parent_id must be ObjectId')
          }
          if (type === TweetType.Tweet && value !== null) {
            throw new Error('parent_id must be null')
          }
          return true
        }
      }
    },
    content: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          if (type === TweetType.Retweet && value !== '') {
            throw new Error('content must be empty')
          }
          if (
            [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(type) &&
            req.body.mentions.length === 0 &&
            req.body.hashtags.length === 0 &&
            value === ''
          ) {
            throw new Error('content must be not empty')
          }
          return true
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          if (!value.every((item: any) => typeof item === 'string')) throw new Error('hashtags must be string')
          return true
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          if (!value.every((item: any) => ObjectId.isValid(item))) throw new Error('mentions must be objectId')
          return true
        }
      }
    },
    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          if (!value.every((item: any) => typeof item.url === 'string' || mediaTypes.includes(item.type)))
            throw new Error('medias must be object')
          return true
        }
      }
    }
  })
)

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) throw new Error('tweet_id must be ObjectId')
            const [tweet] = await databaseService.tweet
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(`${value}`)
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          email: '$$mention.email',
                          username: '$$mention.username'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_child'
                  }
                },
                {
                  $addFields: {
                    bookmarks: {
                      $size: '$bookmarks'
                    },
                    retweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_child',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 1]
                          }
                        }
                      }
                    },
                    comment_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_child',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 2]
                          }
                        }
                      }
                    },
                    quote_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_child',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 3]
                          }
                        }
                      }
                    },
                    view: {
                      $add: ['$user_views', '$guest_views']
                    }
                  }
                },
                {
                  $project: {
                    tweet_child: 0
                  }
                }
              ])
              .toArray()
            if (!tweet) {
              throw new ErrorWithMessage({ message: 'Tweet not found', status: httpStatus.NOT_FOUND })
            }
            ;(req as Request).tweet = tweet
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)
export const isUserLoggedInValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return middleware(req, res, next)
    }
    next()
  }
}
export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  // Nghĩa là ở middleware isUserLoggedInValidator sẽ check nếu không login thì sẽ không chạy middle kiểm tra accesstoken và middle verify
  // vì thế cần kiểm tra là người dùng đã đăng nhập hay chưa
  // kiểm tra tweet này là tweet circle hay không
  if (tweet.audience === TweetAudience.TwitterCircle) {
    // kiểm tra người dùng đăng nhập hay chưa
    if (!req.decoded_access_token) {
      throw new ErrorWithMessage({
        status: httpStatus.UNAUTHORIZED,
        message: userMessage.NOT_LOGGED_IN
      })
    }
    // lấy ra tác giả từ tweet
    const author = await databaseService.user.findOne({
      user_id: tweet.user_id
    })
    // kiểm tra tác giả có ổn ko
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithMessage({
        status: httpStatus.NOT_FOUND,
        message: userMessage.USER_NOT_FOUND
      })
    }
    // kiểm tra người xem tweet có ở trong tweet_circle hay không
    const user_id = req.decoded_access_token.user_id
    const isInTwitterCircle = author.twitter_circle.some((user_circle_id) => user_circle_id.equals(user_id))
    // Nếu bạn không phải là tác giả và không nằm trong twitter circle thì quăng lỗi
    if (!author._id.equals(user_id) && !isInTwitterCircle) {
      throw new ErrorWithMessage({
        status: httpStatus.FORBIDDEN,
        message: 'Tweet is not public'
      })
    }
  }
  next()
})
