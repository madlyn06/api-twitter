import { envConfig } from '~/constant/config'
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import { config } from 'dotenv'
config()
// Create SES service object.
const sesClient = new SESClient({
  region: envConfig.aws_reion,
  credentials: {
    secretAccessKey: envConfig.aws_secret_access_key,
    accessKeyId: envConfig.aws_access_key_id
  }
})

const createSendEmailCommand = ({
  fromAddress,
  toAddresses,
  ccAddresses = [],
  body,
  subject,
  replyToAddresses = []
}: {
  fromAddress: string
  toAddresses: string | string[]
  ccAddresses?: string[] | string
  body: string
  subject: string
  replyToAddresses?: string[] | string
}) => {
  return new SendEmailCommand({
    Destination: {
      /* required */
      CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses],
      ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses]
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: fromAddress,
    ReplyToAddresses: replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses]
  })
}

const sendVerifyEmail = async (toAddress: string, subject: string, body: string) => {
  const sendEmailCommand = createSendEmailCommand({
    fromAddress: envConfig.ses_from_address,
    toAddresses: toAddress,
    body,
    subject
  })

  try {
    return await sesClient.send(sendEmailCommand)
  } catch (e) {
    console.error('Failed to send email.')
    return e
  }
}

sendVerifyEmail('hongnmp@gmail.com', 'Tiêu đề email', '<h1>Nội dung email</h1>')
