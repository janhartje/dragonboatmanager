import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendEmail } from '@/lib/email';
import ContactEmail from '@/emails/templates/ContactEmail';

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { category, message, name, email } = body;

    if (!message || !category) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const senderName = name || session.user.name || 'Anonymous';
    const senderEmail = email || session.user.email || 'no-reply@dragonboatmanager.com';

    try {
        const result = await sendEmail({
            to: 'support@dragonboatmanager.com',
            subject: `[Drachenboot] ${category}: ${senderName}`,
            replyTo: senderEmail,
            react: ContactEmail({
                name: senderName,
                email: senderEmail,
                category,
                message
            }),
        });

        if (!result.success) {
            throw new Error(result.error as string);
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
