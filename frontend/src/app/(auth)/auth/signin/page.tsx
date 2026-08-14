'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { FullPageSpinner } from '@/components/shared/LoadingSpinner'

type BannerError = { type: 'missing' | 'incorrect'; message: string }

export default function SignInPage() {
  const router = useRouter()
  const { user, loading, signInWithEmail, signInWithGoogle } = useAuth()
  const [banner, setBanner] = useState<BannerError | null>(null)

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (!loading && user) {
      router.replace('/teams')
    }
  }, [loading, user, router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verification') === 'sent') {
      toast.success('Verification email sent. Verify your email, then sign in.')
    }
  }, [])

  if (loading) return <FullPageSpinner />

  const onValid = async (data: LoginInput) => {
    setBanner(null)
    try {
      await signInWithEmail(data.email, data.password)
      router.replace('/teams')
      router.refresh()
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('email-not-verified')) {
        toast.error('Please verify your email before signing in.')
      } else {
        setBanner({
          type: 'incorrect',
          message: 'Incorrect details: Email and/or password incorrect. Please try again',
        })
      }
    }
  }

  const onInvalid = () => {
    setBanner({
      type: 'missing',
      message: 'Missing details: Please enter your email and/or password',
    })
  }

  const handleGoogleSignIn = async () => {
    setBanner(null)
    try {
      await signInWithGoogle()
      router.replace('/teams')
    } catch {
      toast.error('Google sign-in failed. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Log in</h1>
        {banner && (
          <p id="signin-banner-error" className="text-sm font-medium text-red-600" role="alert">
            {banner.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>

      <div className="border-t border-zinc-300" />

      <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-900">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!banner}
            aria-describedby={banner ? 'signin-banner-error' : undefined}
            className="focus:ring-brand-500 w-full rounded-md border border-zinc-400 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:ring-2 focus:outline-none"
            {...register('email')}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-zinc-900">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!banner}
            aria-describedby={banner ? 'signin-banner-error' : undefined}
            className="focus:ring-brand-500 w-full rounded-md border border-zinc-400 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:ring-2 focus:outline-none"
            {...register('password')}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-300 hover:bg-brand-400 w-full rounded-full px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in…' : 'Log In'}
        </button>

        <div className="border-t border-zinc-300" />

        <Link
          href="/auth/signup"
          className="bg-brand-300 hover:bg-brand-400 block w-full rounded-full px-4 py-2.5 text-center text-sm font-medium text-zinc-900 transition-colors"
        >
          Create Account
        </Link>
      </form>
    </div>
  )
}
