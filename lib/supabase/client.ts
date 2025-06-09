'use client'

import { useAuth } from '@clerk/nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

export function useSupabaseClient() {
  const { getToken } = useAuth()
  
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken({
            template: 'supabase',
          })

          const headers = new Headers(options?.headers)
          headers.set('Authorization', `Bearer ${clerkToken}`)

          return fetch(url, {
            ...options,
            headers,
          })
        },
      },
    }
  )
}