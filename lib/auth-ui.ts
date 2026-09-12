export const PASSWORD_MIN_LENGTH = 8

export const PASSWORD_RULE_HINT = `At least ${PASSWORD_MIN_LENGTH} characters.`

export const FORGOT_SUCCESS_MESSAGE =
  'If an account exists for that email, we sent a reset link. Check your inbox and spam folder.'

export function passwordIssue(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  return null
}

export function passwordsMatchIssue(password: string, confirm: string): string | null {
  const lengthIssue = passwordIssue(password)
  if (lengthIssue) return lengthIssue
  if (password !== confirm) return 'Passwords do not match.'
  return null
}

export type AuthErrorContext = 'signin' | 'signup' | 'reset' | 'confirm'

const FALLBACK: Record<AuthErrorContext, string> = {
  signin: 'Could not sign in. Check your email and password.',
  signup: 'Could not create your account. Try again.',
  reset: 'Could not update your password. Try again later.',
  confirm: 'Could not confirm your email. Request a new link or try signing in.',
}

export function mapAuthError(
  raw: string | null | undefined,
  context: AuthErrorContext
): string {
  const fallback = FALLBACK[context]
  if (!raw) return fallback

  const message = raw.replace(/\+/g, ' ').trim()
  const lower = message.toLowerCase()

  if (
    lower.includes('invalid login') ||
    lower.includes('invalid credentials') ||
    lower.includes('invalid email or password')
  ) {
    return 'Email or password is incorrect.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email first. Check your inbox and spam folder.'
  }
  if (
    lower.includes('already registered') ||
    lower.includes('already been registered') ||
    lower.includes('user already exists')
  ) {
    return 'An account with this email already exists. Sign in or reset your password.'
  }
  if (
    (lower.includes('password') &&
      (lower.includes('6 character') ||
        lower.includes('8 character') ||
        lower.includes('at least'))) ||
    lower.includes('signup requires a valid password')
  ) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (
    lower.includes('should be different') ||
    lower.includes('different from the old') ||
    lower.includes('same password')
  ) {
    return 'Choose a password you have not used before.'
  }
  if (
    lower.includes('expired') ||
    lower.includes('invalid token') ||
    lower.includes('token has expired') ||
    lower.includes('otp_expired') ||
    lower.includes('access_denied') ||
    lower.includes('auth session missing')
  ) {
    return 'This reset link is invalid or has expired.'
  }
  if (
    lower.includes('rate limit') ||
    lower.includes('only request this after') ||
    lower.includes('over_email') ||
    lower.includes('email rate')
  ) {
    return 'Wait a minute, then try again.'
  }
  if (
    lower.includes('invalid email') ||
    lower.includes('unable to validate email') ||
    (lower.includes('email address') && lower.includes('invalid'))
  ) {
    return 'Enter a valid email address.'
  }
  if (lower.includes('signup is disabled')) {
    return 'New accounts are not open right now. Try again later.'
  }

  return fallback
}
