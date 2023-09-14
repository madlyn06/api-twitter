import { ObjectId } from 'mongodb'

interface RefreshTokenType {
  _id?: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId
  created_at?: Date
}
export class Follower {
  _id?: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId
  created_at?: Date
  constructor({ _id, followed_user_id, user_id }: RefreshTokenType) {
    this._id = _id
    this.user_id = user_id
    this.followed_user_id = followed_user_id
    this.created_at = new Date()
  }
}
