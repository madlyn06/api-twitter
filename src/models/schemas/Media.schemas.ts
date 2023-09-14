import { ObjectId } from 'mongodb'

interface MediasType {
  _id?: ObjectId
  url: string
  created_at?: Date
  user_id: ObjectId
}
export class Medias {
  _id?: ObjectId
  url: string
  user_id: ObjectId
  created_at?: Date
  constructor({ _id, url, user_id }: MediasType) {
    this._id = _id
    this.url = url
    this.created_at = new Date()
    this.user_id = user_id
  }
}
