import { NextResponse } from 'next/server';

// Firebase uses signInWithPopup on the client — no server callback needed.
// This route exists only for backwards compatibility with any old redirect URIs.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`);
}
