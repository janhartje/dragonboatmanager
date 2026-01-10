import { NextResponse } from 'next/server';

export async function GET() {
    if (process.env.NODE_ENV !== 'production') {
        return new NextResponse('Not found', { status: 404 });
    }

    const indexNowKey = process.env.INDEXNOW_KEY;

    if (!indexNowKey) {
        return new NextResponse('Not found', { status: 404 });
    }

    // Return the key as plain text
    return new NextResponse(indexNowKey, {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
