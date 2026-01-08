import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Only protect /admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Check for the "is_admin" cookie set by the client on successful admin login
        const isAdmin = request.cookies.get('is_admin')?.value === 'true';

        if (!isAdmin) {
            // If not admin, redirect to the home page (login)
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
