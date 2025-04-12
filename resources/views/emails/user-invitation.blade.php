<!DOCTYPE html>
<html>
<head>
    <title>Welcome to {{ config('app.name') }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to {{ config('app.name') }}</h2>
        
        <p>Hello {{ $user->first_name }},</p>
        
        <p>You have been invited to join {{ config('app.name') }}. To get started, please set up your password by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $setupUrl }}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Set Up Your Password
            </a>
        </div>
        
        <p>This link will expire in 48 hours for security reasons.</p>
        
        <p>If you did not expect this invitation, please ignore this email.</p>
        
        <p>Best regards,<br>
        The {{ config('app.name') }} Team</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #666;">
            If you're having trouble clicking the button, copy and paste this URL into your web browser:<br>
            <a href="{{ $setupUrl }}" style="color: #4CAF50;">{{ $setupUrl }}</a>
        </p>
    </div>
</body>
</html> 