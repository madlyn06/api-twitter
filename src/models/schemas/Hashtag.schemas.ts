import { ObjectId } from 'mongodb'

interface HashTagType {
  _id?: ObjectId
  name: string
  created_at?: Date
}
export class Hashtag {
  _id?: ObjectId
  name: string
  created_at: Date
  constructor({ _id, name, created_at }: HashTagType) {
    this._id = _id || new ObjectId() // chỗ này khi ta dùng findOneAndUpdate thì mongodb sẽ ko thêm _id vì thế ta phải tự tạo _id cho nó
    this.name = name
    this.created_at = created_at || new Date()
  }
}
