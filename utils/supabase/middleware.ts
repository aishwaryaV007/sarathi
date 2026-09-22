import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Gracefully bypass if Supabase credentials are not configured
  if (!url || !key || url.includes("your-project") || url.includes("xxxx")) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Determine if the route requires authentication
    const isProtectedRoute = 
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/apply") ||
      request.nextUrl.pathname.startsWith("/documents");

    if (isProtectedRoute) {
      // Only make the slow network call to Supabase on protected routes
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/login";
        redirectUrl.searchParams.set("returnTo", request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (err) {
    console.warn("Supabase session update skipped:", err);
  }

  return supabaseResponse;
}
