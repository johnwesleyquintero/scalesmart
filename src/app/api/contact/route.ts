import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface EmailPayload {
  name: string;
  email: string;
  message: string;
}

export async function POST(request: Request) {
  const body: EmailPayload = await request.json();

  // Validate input
  if (!body.name || !body.email || !body.message) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `${body.name} <${body.email}>`,
      to: process.env.CONTACT_EMAIL,
      subject: `New message from ${body.name}`,
      text: body.message,
      html: `<p>${body.message}</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 },
    );
  }
}
