"""
Email service - SMTP email sending with Gmail
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import SMTP_SERVER, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD


def send_password_email(to_email: str, faculty_name: str, password: str) -> bool:
    """
    Send password email to newly created faculty member
    
    Args:
        to_email: Faculty email address
        faculty_name: Faculty member's name
        password: Generated password
    
    Returns:
        True if email sent successfully, False otherwise
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("Warning: SMTP credentials not configured. Email not sent.")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Your Faculty Portal Login Credentials'
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        
        # Email body (HTML)
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                .credentials {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }}
                .credential-item {{ margin: 10px 0; }}
                .label {{ font-weight: bold; color: #555; }}
                .value {{ font-family: monospace; background: #eee; padding: 5px 10px; border-radius: 4px; }}
                .warning {{ color: #e74c3c; font-size: 0.9em; margin-top: 20px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #888; font-size: 0.85em; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎓 Faculty Portal</h1>
                    <p>Welcome to the Faculty Management System</p>
                </div>
                <div class="content">
                    <p>Dear <strong>{faculty_name}</strong>,</p>
                    <p>Your account has been created successfully. Please use the following credentials to login:</p>
                    
                    <div class="credentials">
                        <div class="credential-item">
                            <span class="label">Email:</span>
                            <span class="value">{to_email}</span>
                        </div>
                        <div class="credential-item">
                            <span class="label">Password:</span>
                            <span class="value">{password}</span>
                        </div>
                    </div>
                    
                    <p class="warning">⚠️ Please change your password after first login for security purposes.</p>
                    
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text alternative
        text_body = f"""
        Dear {faculty_name},
        
        Your Faculty Portal account has been created successfully.
        
        Login Credentials:
        Email: {to_email}
        Password: {password}
        
        Please change your password after first login for security purposes.
        
        This is an automated message. Please do not reply.
        """
        
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        
        print(f"Password email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False
