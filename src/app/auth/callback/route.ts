import { NextResponse } from 'next/server';

// Firebase uses client-side redirect auth — no server callback route is required.
// This route exists only for backwards compatibility with any old redirect URIs.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`);
}
