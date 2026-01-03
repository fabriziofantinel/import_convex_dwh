import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import { decrypt } from '../../../lib/encryption';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    // Get email config from Convex
    const emailConfig = await convex.query(api.queries.getEmailConfig);
    
    if (!emailConfig) {
      return NextResponse.json({
        success: false,
        error: 'Email configuration not found'
      }, { status: 404 });
    }

    // Decrypt password
    let decryptedPassword = '';
    try {
      decryptedPassword = decrypt(emailConfig.smtp_password_encrypted);
    } catch (error) {
      console.error('Failed to decrypt email password:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to decrypt email configuration'
      }, { status: 500 });
    }

    // Return decrypted config
    return NextResponse.json({
      success: true,
      config: {
        smtp_host: emailConfig.smtp_host,
        smtp_port: emailConfig.smtp_port,
        smtp_user: emailConfig.smtp_user,
        smtp_password: decryptedPassword,
        from_email: emailConfig.from_email,
        to_emails: emailConfig.to_emails,
        use_tls: emailConfig.use_tls,
      }
    });

  } catch (error) {
    console.error('Error getting email config:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}