import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ownerRoutes = [
  "/dashboard",
  "/rooms",
  "/tenants",
  "/bills",
  "/payments",
  "/expenses",
  "/reports",
  "/settings"
];

const tenantRoutes = ["/tenant"];

function isRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

async function resolveUserRole(
  supabase: ReturnType<typeof createServerClient>,
  user: {
    id: string;
    email?: string;
  }
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "owner" || profile?.role === "tenant") {
    return profile.role as "owner" | "tenant";
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
    .limit(1)
    .maybeSingle();

  return tenant ? "tenant" : null;
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const isOwnerRoute = isRoute(pathname, ownerRoutes);
  const isTenantRoute = isRoute(pathname, tenantRoutes);
  const isProtectedRoute = isOwnerRoute || isTenantRoute;

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = await resolveUserRole(supabase, {
    id: user.id,
    email: user.email
  });

  if (isOwnerRoute && role !== "owner") {
    if (role === "tenant") {
      const tenantUrl = request.nextUrl.clone();
      tenantUrl.pathname = "/tenant";
      return NextResponse.redirect(tenantUrl);
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isTenantRoute && role !== "tenant") {
    if (role === "owner") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/rooms/:path*",
    "/tenants/:path*",
    "/bills/:path*",
    "/payments/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/tenant/:path*"
  ]
};
