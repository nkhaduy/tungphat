import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

if (process.env.DEPLOY_ENV !== 'production') throw new Error('DEPLOY_ENV=production is required')
if (process.env.PRODUCTION_BACKUP_VERIFIED !== '1') throw new Error('A verified D1 backup is required')

const email = process.env.PRODUCTION_ADMIN_EMAIL ?? 'nkhaduy@gmail.com'
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tungphat-payload-production-'))
fs.chmodSync(directory, 0o700)

const password = `${crypto.randomBytes(36).toString('base64url')}!Aa9`
const salt = crypto.randomBytes(32).toString('hex')
const hash = crypto.pbkdf2Sync(password, salt, 25_000, 512, 'sha256').toString('hex')
const timestamp = new Date().toISOString()
const quotedEmail = email.replaceAll("'", "''")

const emailPath = path.join(directory, 'email')
const passwordPath = path.join(directory, 'password')
const sqlPath = path.join(directory, 'reset-admin.sql')
const credentialPath = path.join(directory, 'credential-path')

fs.writeFileSync(emailPath, `${email}\n`, { mode: 0o600 })
fs.writeFileSync(passwordPath, `${password}\n`, { mode: 0o600 })
fs.writeFileSync(sqlPath, `UPDATE users SET salt='${salt}', hash='${hash}', login_attempts=0, lock_until=NULL, reset_password_token=NULL, reset_password_expiration=NULL, updated_at='${timestamp}' WHERE email='${quotedEmail}' AND role='super-admin';\n`, { mode: 0o600 })
fs.writeFileSync(credentialPath, `${emailPath}\n${passwordPath}\n`, { mode: 0o600 })

const result = spawnSync('npm', ['exec', 'wrangler', '--', 'd1', 'execute', 'tungphat-payload-cms', '--remote', '--env', 'production', '--config', 'wrangler.jsonc', '--file', sqlPath], { stdio: 'inherit' })
if (result.status !== 0) throw new Error(`Production admin rotation failed with exit ${String(result.status)}`)

fs.writeFileSync(path.join(os.tmpdir(), 'tungphat-payload-production-credential-path'), `${credentialPath}\n`, { mode: 0o600 })
console.log(JSON.stringify({ ok: true, email, role: 'super-admin', credentialPath, passwordPrinted: false }, null, 2))
