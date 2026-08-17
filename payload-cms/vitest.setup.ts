import dotenv from 'dotenv'

dotenv.config({ path: 'test.env' })

process.env.PAYLOAD_SECRET ||= 'payload-integration-test-secret-not-for-production'
process.env.CMS_ENVIRONMENT ||= 'local'
