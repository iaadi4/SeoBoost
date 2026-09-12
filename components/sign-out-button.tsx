'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function SignOutButton({
  className = 'rounded-full px-3',
  size = 'sm',
  variant = 'ghost',
}: {
  className?: string
  size?: 'sm' | 'lg'
  variant?: 'ghost' | 'outline'
}) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/seo-audit-login')
    router.refresh()
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
    >
      Sign out
    </Button>
  )
}
