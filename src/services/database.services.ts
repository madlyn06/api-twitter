import { envConfig } from '~/constant/config'
import { RefreshToken } from './../models/schemas/RefreshToken.schemas'
import { connect } from 'http2'
import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb'
import { config } from 'dotenv'
import { User } from '~/models/schemas/User.schemas'
import { Follower } from '~/models/schemas/Follow.schemas'
import { Medias } from '~/models/schemas/Media.schemas'
import { Tweet } from '~/models/schemas/Tweet.schemas'
import { Hashtag } from '~/models/schemas/Hashtag.schemas'
import { Bookmark } from '~/models/schemas/Bookmark.schemas'
config()
const uri = `mongodb+srv://${envConfig.db_username}:${envConfig.db_password}@twitterapi.pgdpee6.mongodb.net/?retryWrites=true&w=majority`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db('twitter-api')
  }
  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
    }
  }

  get tweet(): Collection<Tweet> {
    return this.db.collection('tweets')
  }
  get user(): Collection<User> {
    return this.db.collection('users')
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection('refresh_token')
  }
  get followers(): Collection<Follower> {
    return this.db.collection('followers')
  }
  get medias(): Collection<Medias> {
    return this.db.collection('medias')
  }
  get hashtags(): Collection<Hashtag> {
    return this.db.collection('hashtags')
  }
  get bookmarks(): Collection<Bookmark> {
    return this.db.collection('bookmarks')
  }
}
export const databaseService = new DatabaseService()
