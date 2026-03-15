// import NextAuth from "next-auth";
// import { authConfig } from "@/lib/auth.config";
// import { NextResponse } from "next/server";

// const { auth } = NextAuth(authConfig);

// export default auth((req) => {
//   const { pathname } = req.nextUrl;
//   const isLoggedIn = !!req.auth;
//   const usernameSet = req.auth?.user?.usernameSet;

//   const protectedPaths = ["/dashboard", "/profile"];
//   const authPaths = ["/login", "/register"];
//   const onboardingPath = "/onboarding/username";

//   const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
//   const isAuthPage = authPaths.some((p) => pathname.startsWith(p));
//   const isOnboarding = pathname.startsWith(onboardingPath);

//   if (isProtected) {
//     if (!isLoggedIn) {
//       return NextResponse.redirect(new URL("/login", req.url));
//     }
//     if (!usernameSet) {
//       return NextResponse.redirect(new URL("/onboarding/username", req.url));
//     }
//   }

//   if (isOnboarding) {
//     if (!isLoggedIn) {
//       return NextResponse.redirect(new URL("/login", req.url));
//     }
//     if (usernameSet) {
//       return NextResponse.redirect(new URL("/dashboard", req.url));
//     }
//   }

//   if (isAuthPage) {
//     if (isLoggedIn && usernameSet) {
//       return NextResponse.redirect(new URL("/dashboard", req.url));
//     }
//     if (isLoggedIn && !usernameSet) {
//       return NextResponse.redirect(new URL("/onboarding/username", req.url));
//     }
//   }

//   return NextResponse.next();
// });

// export const config = {
//   matcher: [
//     "/dashboard/:path*",
//     "/profile/:path*",
//     "/onboarding/:path*",
//     "/login",
//     "/register",
//   ],
// };

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const usernameSet = req.auth?.user?.usernameSet;

  const protectedPaths = ["/dashboard", "/profile"];
  const authPaths = ["/login", "/register"];
  const onboardingPath = "/onboarding/username";

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));
  const isOnboarding = pathname.startsWith(onboardingPath);

  if (isProtected) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (!usernameSet) {
      return NextResponse.redirect(new URL("/onboarding/username", req.url));
    }
  }

  if (isOnboarding) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (usernameSet) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (isAuthPage) {
    if (isLoggedIn && usernameSet) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (isLoggedIn && !usernameSet) {
      return NextResponse.redirect(new URL("/onboarding/username", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/login",
    "/register",
  ],
};
