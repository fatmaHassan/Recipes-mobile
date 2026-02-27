# Authentication Setup Guide

## Installation

First, install the required package for secure token storage:

```bash
npm install expo-secure-store
```

## Features Implemented

✅ **Authentication Service** (`services/auth.ts`)
- Login and register functionality
- Secure token storage using expo-secure-store
- Token management and validation
- Logout functionality

✅ **Auth Context** (`contexts/AuthContext.tsx`)
- Global authentication state management
- React Context provider for auth state
- `useAuth()` hook for accessing auth state

✅ **Login Screen** (`app/login.tsx`)
- Email and password login
- Form validation
- Error handling

✅ **Register Screen** (`app/register.tsx`)
- User registration with name, email, password
- Password confirmation
- Form validation

✅ **Profile Screen** (`app/(tabs)/profile.tsx`)
- Display user information
- Logout functionality

✅ **Protected Routes**
- Automatic redirect to login if not authenticated
- Redirect to home after successful login/register
- Token automatically included in API requests

## How It Works

### 1. Authentication Flow

1. **App Start**: The `AuthProvider` initializes and checks for stored tokens
2. **Login/Register**: User enters credentials, token is stored securely
3. **API Requests**: Token is automatically included in all API requests
4. **Token Expiry**: If token is invalid (401), user is logged out

### 2. Token Storage

Tokens are stored securely using `expo-secure-store`, which uses:
- iOS: Keychain
- Android: Encrypted SharedPreferences

### 3. API Integration

The `apiService` automatically includes the authentication token in all requests:

```typescript
// Token is automatically added to headers
apiService.setAuthToken(token);
// All subsequent requests include: Authorization: Bearer {token}
```

## Usage

### Using Auth in Components

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <Text>Please login</Text>;
  }
  
  return <Text>Welcome, {user?.name}!</Text>;
}
```

### Making Authenticated API Calls

```typescript
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/constants/api';

// Token is automatically included
const recipes = await apiService.get(API_CONFIG.ENDPOINTS.RECIPES_SEARCH);
```

## Laravel API Requirements

Your Laravel API should:

1. **Return token on login/register**:
```json
{
  "token": "your-sanctum-token",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

2. **Accept Bearer token in Authorization header**:
```
Authorization: Bearer {token}
```

3. **Return 401 on invalid/expired token**

## Testing

1. **Register a new user**:
   - Open the app
   - Tap "Sign Up"
   - Fill in the form
   - Submit

2. **Login**:
   - Enter email and password
   - Tap "Sign In"

3. **Access protected endpoints**:
   - After login, API requests automatically include the token
   - Protected endpoints should work

4. **Logout**:
   - Go to Profile tab
   - Tap "Logout"
   - You'll be redirected to login screen

## Troubleshooting

### "expo-secure-store" not found
Run: `npm install expo-secure-store`

### Token not being sent
- Check that `apiService.setAuthToken()` is called after login
- Verify token is stored: Check `authService.getToken()`

### 401 errors after login
- Verify Laravel API returns token in response
- Check token format matches expected structure
- Ensure CORS allows Authorization header

### Navigation issues
- Check that routes are properly configured in `app/_layout.tsx`
- Verify AuthProvider wraps the app correctly

## Next Steps

1. Add token refresh functionality
2. Implement "Remember Me" option
3. Add social login (Google, Apple, etc.)
4. Add password reset functionality
5. Add email verification
