import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project") || url.includes("xxxx")) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    } as any;
  }

  const supabase = createBrowserClient(url, key);

  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^| )demo_mock_email=([^;]+)'));
    if (match) {
      const mockEmail = decodeURIComponent(match[2]);
      const mockUser = { id: "mock-user-1234", email: mockEmail } as any;
      
      supabase.auth.getUser = async () => ({ data: { user: mockUser }, error: null });
      supabase.auth.getSession = async () => ({
        data: { session: { user: mockUser } as any },
        error: null
      });
      supabase.auth.onAuthStateChange = (callback) => {
        callback('SIGNED_IN', { user: mockUser } as any);
        return { data: { subscription: { unsubscribe: () => {} } } };
      };
      supabase.auth.signOut = async () => {
        document.cookie = "demo_mock_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.reload();
      };
    }
  }

  return supabase;
}
