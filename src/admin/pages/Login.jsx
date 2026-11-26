import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../auth.jsx'
import BrandMark from '../components/BrandMark.jsx'
import { Btn, Card, Field, inputClass } from '../components/ui.jsx'

export default function Login() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const goTo = location.state?.from?.startsWith('/admin') ? location.state.from : '/admin/events'

  if (loading) return <div className="min-h-dvh bg-cream" />
  if (session) return <Navigate to={goTo} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setSubmitting(false)
    if (error) {
      setError(/invalid/i.test(error.message) ? 'Wrong email or password.' : error.message)
      return
    }
    toast.success('Welcome back!')
    navigate(goTo, { replace: true })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-4 py-10 font-body text-plum">
      <Card className="w-full max-w-sm px-6 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <BrandMark size="lg" showName={false} />
          <div>
            <h1 className="font-heading text-[28px] font-medium">Welcome back</h1>
            <p className="mt-1 text-[14px] text-plum-soft">Log in to manage your website.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-2xl bg-[#FDECEC] px-4 py-3 text-[14px] text-[#9A1D23]">
              {error}
            </p>
          )}

          <Btn type="submit" loading={submitting} className="mt-2 w-full">
            {submitting ? 'Logging in…' : 'Log in'}
          </Btn>
        </form>
      </Card>
    </div>
  )
}
