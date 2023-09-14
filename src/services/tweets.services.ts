import { ObjectId, WithId } from 'mongodb'
import { TweetType } from '~/constant/enum'
import { TweetRequestBody } from '~/models/request/Tweet.request'
import { Bookmark } from '~/models/schemas/Bookmark.schemas'
import { Hashtag } from '~/models/schemas/Hashtag.schemas'
import { Tweet } from '~/models/schemas/Tweet.schemas'
import { databaseService } from './database.services'

export class TweetsService {
  async findAndCreateHashtag(hashtags: string[]) {
    const result = await Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          {
            $setOnInsert: new Hashtag({
              name: hashtag
            })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        )
      })
    )
    return result.map((item) => (item.value as WithId<Hashtag>)._id)
  }
  async createTweet(user_id: string, body: TweetRequestBody) {
    const hashtags = await this.findAndCreateHashtag(body.hashtags)
    const result = await databaseService.tweet.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags,
        medias: body.medias,
        user_id: new ObjectId(user_id),
        type: body.type,
        mentions: body.mentions,
        parent_id: body.parent_id
      })
    )
  }
  async bookmarkTweet(user_id: ObjectId, body: { tweet_id: ObjectId }) {
    await databaseService.bookmarks.findOneAndUpdate(
      { user_id, tweet_id: new ObjectId(body.tweet_id) },
      {
        $setOnInsert: new Bookmark({
          user_id,
          tweet_id: new ObjectId(body.tweet_id),
          created_at: new Date()
        })
      },
      {
        upsert: true
      }
    )
  }
  async unbookmarkTweet(user_id: ObjectId, tweet_id: ObjectId) {
    await databaseService.bookmarks.findOneAndDelete({
      user_id,
      tweet_id: new ObjectId(tweet_id)
    })
  }
  async getTweetParen({
    tweet_id,
    tweet_type,
    page,
    limit
  }: {
    tweet_id: ObjectId
    tweet_type: TweetType
    page: number
    limit: number
  }) {
    const tweets = await databaseService.tweet
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type // 1: ReTweet, 2: Comment, 3: QuoteTweet
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
                    $eq: ['$$item.type', TweetType.Retweet]
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
                    $eq: ['$$item.type', TweetType.Comment]
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
                    $eq: ['$$item.type', TweetType.QuoteTweet]
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
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray()
    return tweets
  }
  async getTweetsNewFeeds({ user_id, limit, page }: { user_id: ObjectId; limit: number; page: number }) {
    const used_id_obj = new ObjectId(user_id)
    const followed_user_ids = await databaseService.followers
      .find(
        {
          user_id: used_id_obj
        },
        {
          projection: {
            _id: 0,
            followed_user_id: 1
          }
        }
      )
      .toArray()
    const ids = followed_user_ids.map((user) => user.followed_user_id)
    ids.push(user_id)
    console.log(limit * (page - 1))
    const tweets = await databaseService.tweet
      .aggregate<Tweet>([
        {
          $match: {
            user_id: {
              $in: ids
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $match: {
            $or: [
              {
                audience: 0
              },
              {
                $and: [
                  {
                    audience: 1
                  },
                  {
                    'user.twitter_circle': {
                      $in: [user_id]
                    }
                  }
                ]
              }
            ]
          }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        },
        {
          $unwind: {
            path: '$user'
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
            tweet_child: 0,
            user: {
              forgot_password_token: 0,
              email_verify_token: 0,
              date_of_birth: 0,
              password: 0
            }
          }
        }
      ])
      .toArray()
    return tweets
  }
}
export const tweetsService = new TweetsService()
