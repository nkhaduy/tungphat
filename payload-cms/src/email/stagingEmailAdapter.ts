import type { PayloadEmailAdapter } from 'payload'

export const stagingEmailAdapter: PayloadEmailAdapter = ({ payload }) => ({
  name: `tungphat-${process.env.CMS_ENVIRONMENT ?? 'local'}-suppressed`,
  defaultFromAddress: process.env.CMS_ENVIRONMENT === 'production' ? 'no-reply@mdftungphat.com' : 'no-reply@staging.invalid',
  defaultFromName: process.env.CMS_ENVIRONMENT === 'production' ? 'Tùng Phát CMS' : 'Tùng Phát CMS Staging',
  sendEmail: async (message) => {
    const recipients = Array.isArray(message.to) ? message.to.length : message.to ? 1 : 0
    payload.logger.info({ msg: 'Outbound CMS email suppressed: no production provider configured', environment: process.env.CMS_ENVIRONMENT ?? 'local', recipients, category: typeof message.subject === 'string' && /password|mật khẩu/i.test(message.subject) ? 'password-flow' : 'notification' })
  },
})
