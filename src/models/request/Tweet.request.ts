import { ObjectId } from 'mongodb'
import { Media, TweetAudience, TweetType } from '~/constant/enum'

export interface TweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string //  chỉ null khi tweet gốc
  hashtags: string[]
  mentions: string[]
  medias: Media[]
}
