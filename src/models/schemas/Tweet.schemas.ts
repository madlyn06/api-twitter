import { ObjectId } from 'mongodb'
import { Media, TweetAudience, TweetType } from '~/constant/enum'

interface TweetContrucstor {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string //  chỉ null khi tweet gốc
  hashtags: ObjectId[]
  mentions: string[]
  medias: Media[]
  guest_views?: number
  user_views?: number
  created_at?: Date
  updated_at?: Date
}
export class Tweet {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | ObjectId //  chỉ null khi tweet gốc
  hashtags: ObjectId[]
  mentions: ObjectId[]
  medias: Media[]
  guest_views: number
  user_views: number
  created_at: Date
  updated_at: Date
  constructor({
    _id,
    user_id,
    type,
    audience,
    content,
    parent_id,
    hashtags,
    mentions,
    medias,
    guest_views,
    user_views,
    created_at,
    updated_at
  }: TweetContrucstor) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.type = type
    this.audience = audience
    this.content = content
    this.parent_id = parent_id ? new ObjectId(parent_id) : null
    this.hashtags = hashtags
    this.mentions = mentions.map((item) => new ObjectId(item))
    this.medias = medias
    this.guest_views = guest_views || 0
    this.user_views = user_views || 0
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}
