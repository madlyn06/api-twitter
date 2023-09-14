import { RefreshToken } from './../models/schemas/RefreshToken.schemas'
export enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực email
  Banned // bị khóa
}
export enum TokenType {
  RefreshToken,
  AccessToken,
  EmailVerifyToken,
  ForgotPasswordToken
}
export enum MediaType {
  Image,
  Video
}
export interface Media {
  url: string
  type: MediaType // video, image
}
export enum TweetAudience {
  Everyone, // 0
  TwitterCircle // 1
}
export enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}
