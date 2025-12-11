import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
const contact = process.env.WEB_PUSH_CONTACT;

if (publicKey && privateKey && contact) {
  webpush.setVapidDetails(contact, publicKey, privateKey);
}

export async function POST(request: NextRequest) {
  if (!publicKey || !privateKey || !contact) {
    return NextResponse.json(
      { error: 'VAPID keys are not configured on the server' },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const subscription = (body as any)?.subscription;
  const title = (body as any)?.title ?? 'Journee Web Push';
  const message = (body as any)?.body ?? 'Server-sent web push for testing.';

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
  }

  const payload = JSON.stringify({ title, body: message });

  try {
    await webpush.sendNotification(subscription, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[web-push] sendNotification failed', error);
    return NextResponse.json({ error: 'Failed to send push notification' }, { status: 500 });
  }
}
