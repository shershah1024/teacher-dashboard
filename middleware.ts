import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/(.*)",
  "/teacher-dashboard(.*)", // Temporarily make teacher dashboard public for development
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return;
  }

  // For all other routes, require authentication
  // This will redirect to sign-in if not authenticated
  // Note: This is only for teachers - students never access this dashboard
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.*\\.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|css|js|map|txt|xml|otf|ttf|woff|woff2)).*)",
    "/(api|trpc)(.*)",
  ],
};