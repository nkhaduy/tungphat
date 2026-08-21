'use client'

import { email } from 'payload/shared'
import { formatAdminURL, getSafeRedirect } from 'payload/shared'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import React, { useEffect, useMemo, useState } from 'react'
import {
  EmailField,
  Form,
  FormSubmit,
  useAuth,
  useConfig,
  useField,
  useForm,
  useFormProcessing,
  useFormSubmitted,
  useTranslation,
} from '@payloadcms/ui'

type PasswordInputProps = {
  label: string
  required?: boolean
}

function PasswordInput({ label, required = true }: PasswordInputProps) {
  const { errorMessage, setValue, showError, value } = useField<string>({
    path: 'password',
    validate: (input) => (input ? true : 'Vui lòng nhập mật khẩu.'),
  })
  const [visible, setVisible] = useState(false)

  return (
    <div className={['field-type', 'password', 'tp-login-password', showError && 'error'].filter(Boolean).join(' ')}>
      <label className="field-label" htmlFor="field-password">
        {label} {required ? <span className="required">*</span> : null}
      </label>
      <div className="tp-login-password__wrap">
        <input
          aria-describedby={showError ? 'field-password-error' : undefined}
          aria-invalid={showError || undefined}
          autoComplete="current-password"
          id="field-password"
          name="password"
          onChange={(event) => setValue(event.target.value)}
          required={required}
          type={visible ? 'text' : 'password'}
          value={value || ''}
        />
        <button
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          aria-pressed={visible}
          className="tp-password-toggle"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? 'Ẩn' : 'Hiện'}
        </button>
      </div>
      {showError ? (
        <p className="field-error" id="field-password-error" role="alert">
          {errorMessage || 'Vui lòng nhập mật khẩu.'}
        </p>
      ) : null}
    </div>
  )
}

function LoginSubmit() {
  const processing = useFormProcessing()
  return (
    <FormSubmit className="tp-login-submit" aria-busy={processing}>
      <span className={processing ? 'tp-submit-label tp-submit-label--loading' : 'tp-submit-label'}>
        {processing ? <span aria-hidden="true" className="tp-login-spinner" /> : null}
        {processing ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </span>
    </FormSubmit>
  )
}

function LoginSubmissionReset() {
  const submitted = useFormSubmitted()
  const { setSubmitted } = useForm()

  useEffect(() => {
    if (submitted) setSubmitted(false)
  }, [setSubmitted, submitted])

  return null
}

export default function LoginForm() {
  const { config } = useConfig()
  const { t } = useTranslation()
  const { setUser, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('')
  const userSlug = config.admin.user
  const { admin: adminRoute, api: apiRoute } = config.routes
  const redirect = useMemo(
    () => {
      const redirectTo = searchParams.get('redirect')
      return getSafeRedirect({ fallbackTo: adminRoute, redirectTo: redirectTo || adminRoute })
    },
    [adminRoute, searchParams],
  )

  useEffect(() => {
    if (user) router.replace(redirect)
  }, [redirect, router, user])

  return (
    <main className="tp-login-view">
      <div aria-hidden="true" className="tp-login-view__wash" />
      <div className="tp-login-view__content">
        <section aria-labelledby="tp-login-title" className="tp-login-card">
          <Image alt="Tùng Phát" className="tp-login-card__logo" height={86} priority src="/brand/logo-horizontal.png" width={286} />
          <div className="tp-login-card__intro">
            <h1 id="tp-login-title">CMS</h1>
          </div>
          <Form
            action={formatAdminURL({ apiRoute, path: `/${userSlug}/login` })}
          className="tp-login-form"
            disableValidationOnSubmit
            disableSuccessStatus
            initialState={{
              email: { initialValue: '', valid: true, value: '' },
              password: { initialValue: '', valid: true, value: '' },
            }}
            method="POST"
            onSubmit={() => setStatus('Đang kiểm tra thông tin đăng nhập...')}
            onSuccess={async (data) => {
              setStatus('Đăng nhập thành công. Đang mở khu vực quản trị...')
              if (data && typeof data === 'object' && 'user' in data) setUser(data as never)
            }}
            redirect={redirect}
            waitForAutocomplete
          >
            <LoginSubmissionReset />
            <EmailField
              field={{ admin: { autoComplete: 'email' }, label: t('general:email'), name: 'email', required: true }}
              path="email"
              validate={email}
            />
            <PasswordInput label={t('general:password')} />
            <p aria-live="polite" className="tp-login-status">
              {status}
            </p>
            <LoginSubmit />
          </Form>
        </section>
      </div>
    </main>
  )
}
