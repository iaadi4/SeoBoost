import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session?.user) {
      // Sync user to our custom Prisma DB logic
      const user = data.session.user

      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          image: user.user_metadata?.avatar_url || '',
        },
        create: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          image: user.user_metadata?.avatar_url || '',
        },
      })

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        redirect(`https://${forwardedHost}${next}`)
      } else {
        redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  redirect(`${origin}/seo-audit-login?error=true`)
}
