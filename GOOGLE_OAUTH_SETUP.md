# Google OAuth Setup for Production

This guide will help you configure Google OAuth for the production deployment of Sabiteck.

## 1. Google Cloud Console Setup

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project or create a new one

### Step 2: Enable Google+ API
1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for "Google+ API" or "People API"
3. Click on the API and click **"Enable"**

### Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Fill in the required information:
   - **App name**: Sabiteck
   - **User support email**: Your email address
   - **Developer contact email**: Your email address
   - **Authorized domains**: Add `sabiteck.com`
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Save and continue

### Step 4: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **"Create Credentials"** > **"OAuth 2.0 Client IDs"**
3. Choose **Web application**
4. Configure the following:

#### Application Name
```
Sabiteck Production
```

#### Authorized JavaScript Origins
```
https://sabiteck.com
```

#### Authorized Redirect URIs
```
https://backend.sabiteck.com/api/auth/google/callback
```

5. Click **"Create"**
6. Copy the **Client ID** and **Client Secret**

## 2. Backend Configuration

### Update .env.production
Replace the placeholder values in your `.env.production` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret-here
GOOGLE_REDIRECT_URI=https://backend.sabiteck.com/api/auth/google/callback
```

### Verify API Endpoints
Ensure these endpoints are working:
- `GET https://backend.sabiteck.com/api/auth/google/callback` - OAuth callback
- `POST https://backend.sabiteck.com/api/auth/google` - Token verification

## 3. Frontend Configuration

### Update API Base URL
In your frontend environment configuration, set:

```javascript
// For production
const API_BASE_URL = 'https://backend.sabiteck.com/api';

// Google OAuth client configuration
const GOOGLE_CLIENT_ID = 'your-actual-google-client-id-here';
```

### Google OAuth Flow Implementation
The frontend should implement the OAuth flow as follows:

1. **Initiate OAuth**: Redirect user to Google OAuth
2. **Handle Callback**: Receive authorization code
3. **Exchange for Token**: Send code to backend
4. **Store JWT**: Store the returned JWT token

## 4. Testing the OAuth Flow

### Test Checklist
- [ ] Google OAuth consent screen displays correctly
- [ ] User can authorize the application
- [ ] Authorization code is received at callback URL
- [ ] Backend exchanges code for user information
- [ ] JWT token is generated and returned
- [ ] Frontend receives and stores the token
- [ ] User is successfully logged in

### Test URLs
1. **OAuth Initiate**: `https://accounts.google.com/oauth2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=https://backend.sabiteck.com/api/auth/google/callback&scope=email%20profile&response_type=code`

2. **Test Callback**: After authorization, you should be redirected to the callback URL

3. **Verify User Info**: Check that user data is correctly stored in your database

## 5. Security Considerations

### Production Security Checklist
- [ ] Client secret is kept secure and not exposed to frontend
- [ ] HTTPS is enforced on all OAuth endpoints
- [ ] Callback URL validation is implemented
- [ ] Token expiration is properly handled
- [ ] User consent is properly captured
- [ ] Rate limiting is implemented on OAuth endpoints

### CORS Configuration
Ensure your backend CORS settings allow requests from:
- `https://sabiteck.com`

## 6. Troubleshooting

### Common Issues

#### "redirect_uri_mismatch" Error
- Ensure the redirect URI in Google Console exactly matches the one in your code
- Check for trailing slashes or typos
- Verify the protocol (https://)

#### "invalid_client" Error
- Check that the client ID and secret are correct
- Ensure the OAuth credentials are for a "Web application" type

#### CORS Errors
- Verify your backend CORS configuration
- Check that the frontend domain is allowed
- Ensure preflight OPTIONS requests are handled

#### SSL/HTTPS Issues
- Ensure SSL certificates are properly configured
- Test HTTPS connectivity to both domains
- Verify certificate chain is complete

### Debug Steps
1. Check browser network tab for failed requests
2. Verify backend logs for OAuth errors
3. Test OAuth flow with tools like Postman
4. Validate JWT tokens using jwt.io

## 7. Production Deployment Steps

1. **Update Google Cloud Console** with production URLs
2. **Deploy backend** with production environment variables
3. **Update frontend** with production API URLs
4. **Test OAuth flow** thoroughly
5. **Monitor logs** for any OAuth-related errors

## 8. Maintenance

### Regular Tasks
- Monitor OAuth usage in Google Cloud Console
- Rotate client secrets periodically
- Update scope permissions as needed
- Review OAuth consent screen information

### Monitoring
- Set up alerts for OAuth failures
- Monitor user authentication rates
- Track OAuth conversion rates

---

## Support

If you encounter issues with Google OAuth setup:

1. Check the [Google OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)
2. Review the [Google Cloud Console help](https://cloud.google.com/support)
3. Verify your implementation against Google's best practices

Remember to test thoroughly before going live with production OAuth settings!