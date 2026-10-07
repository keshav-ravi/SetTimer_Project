// Runs before every page request. It (1) refreshes the login cookies so the
// session doesn't silently expire, and (2) sends signed-out visitors to
// /login. It does NOT run for /api routes: QStash calls /api/send without a
// login (that route checks QStash's signature instead), and the other API
// routes check the user themselves.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() asks Supabase to verify the session, so a forged cookie fails.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const onLoginPage = request.nextUrl.pathname === "/login";
  const redirectTo =
    !user && !onLoginPage ? "/login" : user && onLoginPage ? "/" : null;

  if (redirectTo) {
    const redirect = NextResponse.redirect(new URL(redirectTo, request.url));
    // Keep any refreshed login cookies on the redirect too.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}

export const config = {
  matcher: [
    // Everything except API routes, Next.js internals and static/PWA files.
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:png|svg|jpg|jpeg|ico)$).*)",
  ],
};
