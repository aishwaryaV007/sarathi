import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Safe fallback mock when Supabase credentials are not set locally
  if (!url || !key || url.includes("your-project") || url.includes("xxxx")) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: null }),
          }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
    } as any;
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from Server Component
          }
        },
      },
    }
  );

  // PROTOTYPE MOCK: Override auth behavior if demo cookie is present
  const mockEmail = cookieStore.get("demo_mock_email")?.value;
  if (mockEmail) {
    const mockUser = { id: "mock-user-1234", email: mockEmail } as any;
    supabase.auth.getUser = async () => ({ data: { user: mockUser }, error: null });
    supabase.auth.getSession = async () => ({
      data: { session: { user: mockUser } as any },
      error: null
    });
  }

  return supabase;
}
