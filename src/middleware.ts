import { NextRequest, NextResponse } from "next/server";


type Session = {
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    companyId: string;
    role: string;
  };
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes
  const publicRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Allow API auth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Get session from Better Auth API using native fetch
  let session = null;
  try {
    const res = await fetch(new URL("/api/auth/get-session", request.url).toString(), {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });
    if (res.ok) {
      session = await res.json();
    }
  } catch (error) {
    console.error("Error fetching session in middleware:", error);
  }

  if (!session && !isPublicRoute) {
    // Redirect to login if unauthenticated
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (session && isPublicRoute) {
    // Redirect to dashboard if authenticated and trying to access login/register
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
