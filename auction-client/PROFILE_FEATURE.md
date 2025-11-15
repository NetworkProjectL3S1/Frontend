# User Profile Feature - Documentation

## Overview

The application now includes a comprehensive user profile page where users can view and edit their account details.

## Features

### Profile View
- **User Avatar**: Display user's initial in a circular badge
- **Username**: Display (read-only)
- **Email**: Display and editable
- **Role**: Display account type (Buyer/Seller) with icon
- **Account Statistics**: Placeholder for future activity tracking

### Profile Edit
- **Edit Mode Toggle**: Switch between view and edit modes
- **Email Update**: Change email address
- **Password Change**: Update password with current password verification
- **Validation**: Client and server-side validation
- **Real-time Feedback**: Success and error messages

## Navigation

Users can switch between:
- **Auctions View**: Browse and manage auctions (List icon)
- **My Profile**: View and edit profile (User icon)

Toggle button is located in the header next to the logout button.

## Frontend Components

### UserProfile Component
**Location**: `Frontend-1/auction-client/src/components/UserProfile.jsx`

**Features**:
- View mode displays all user information
- Edit mode allows updating email and password
- Form validation before submission
- Success/error message display
- Responsive design with card-based layout
- Account statistics cards (extensible for future features)

**State Management**:
- Uses AuthContext for user data
- Local state for form data and edit mode
- Updates localStorage and context on successful edit

### App Component Updates
**Location**: `Frontend-1/auction-client/src/App.jsx`

**Changes**:
- Added navigation state (`currentView`)
- Profile toggle button in header
- Conditional rendering of AuctionList or UserProfile
- List/User icons for visual clarity

### AuthContext Updates
**Location**: `Frontend-1/auction-client/src/contexts/AuthContext.jsx`

**Changes**:
- Exposed `setUser` method for profile updates
- Allows components to update user data after profile changes

## Backend API

### Update Profile Endpoint

**Endpoint**: `PUT /api/auth/update-profile`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "newemail@example.com",
  "currentPassword": "oldpass123",  // Required only if changing password
  "newPassword": "newpass123"       // Optional
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "username": "john_doe",
    "email": "newemail@example.com",
    "role": "BUYER"
  }
}
```

**Error Responses**:
- `401`: Unauthorized (invalid/missing token)
- `400`: Validation error (invalid email, weak password, etc.)
- `500`: Server error

### Backend Components

#### AuthController.java
**New Method**: `handleUpdateProfile()`

**Features**:
- Token-based authentication from Authorization header
- Email validation
- Password change with current password verification
- Calls DatabaseManager methods for updates

#### DatabaseManager.java
**New Methods**:
1. `updateUserEmail(String username, String email)`
   - Updates user's email address
   - Returns boolean success status

2. `updateUserPassword(String username, String newPassword)`
   - Hashes and updates user's password
   - Returns boolean success status

**Database Operations**:
- SQL UPDATE statements with timestamp updates
- Password hashing using SHA-256
- Transaction safety with PreparedStatements

## Usage Flow

### Viewing Profile

1. Click "My Profile" button in header
2. View all account information
3. See account statistics

### Editing Profile

1. Click "My Profile" in header
2. Click "Edit Profile" button
3. Modify email address (optional)
4. To change password:
   - Enter current password
   - Enter new password (min 6 characters)
   - Confirm new password
5. Click "Save Changes"
6. View success message
7. Profile automatically returns to view mode

### Validation Rules

**Email**:
- Must contain @ symbol
- Can be empty

**Password Change**:
- Current password required
- New password minimum 6 characters
- New password and confirmation must match
- Current password must be correct

## UI/UX Features

### Visual Design
- Gradient avatar with username initial
- Color-coded role badges
- Card-based layout
- Responsive grid for statistics
- Clear edit/view mode distinction

### User Feedback
- Success messages (green banner)
- Error messages (red banner)
- Loading states on buttons
- Disabled inputs during save
- Auto-hiding success messages (3 seconds)

### Accessibility
- Proper label associations
- Icon + text buttons
- Clear disabled states
- Descriptive placeholders
- Read-only field indicators

## Security

### Frontend
- Token stored in localStorage
- Token sent in Authorization header
- HTTPS recommended for production

### Backend
- Bearer token authentication
- Password verification before changes
- Password hashing (SHA-256)
- SQL injection prevention (PreparedStatements)
- Input validation and sanitization

## Testing

### Manual Testing

**Test Email Update**:
```bash
# 1. Login to get token
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123456"}'

# 2. Update email (replace <TOKEN> with actual token)
curl -X PUT http://localhost:8081/api/auth/update-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"email":"newemail@test.com"}'
```

**Test Password Update**:
```bash
curl -X PUT http://localhost:8081/api/auth/update-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"currentPassword":"test123456","newPassword":"newpass123456"}'
```

### Frontend Testing Checklist

- [ ] View profile page
- [ ] See correct user information
- [ ] Click edit button
- [ ] Update email address
- [ ] Update password with valid credentials
- [ ] Try invalid email format
- [ ] Try password mismatch
- [ ] Try wrong current password
- [ ] Cancel editing
- [ ] Toggle between auctions and profile views

### Database Verification

```bash
# Check updated user data
sqlite3 data/auction_system.db "SELECT username, email, updated_at FROM users WHERE username='testuser';"
```

## Future Enhancements

### Planned Features
1. **Profile Picture Upload**: Allow custom avatars
2. **Account Statistics**: Show real bid/auction counts
3. **Activity History**: Display recent actions
4. **Notification Preferences**: Email/app notifications
5. **Account Deletion**: Self-service account removal
6. **Two-Factor Authentication**: Enhanced security
7. **Social Links**: Connect social media accounts
8. **Transaction History**: View payment history

### Data to Track
- Total bids placed
- Active auctions (selling)
- Won auctions (buying)
- Account creation date
- Last login timestamp
- Email verification status

## Troubleshooting

### Common Issues

**Token Expired**:
- Re-login to get new token
- Check token in localStorage

**Email Not Updating**:
- Verify token is valid
- Check server logs
- Verify database connection

**Password Change Failed**:
- Ensure current password is correct
- Check minimum length requirement
- Verify password confirmation matches

**Profile Button Not Showing**:
- Ensure user is logged in
- Check AuthContext is providing user data
- Verify imports in App.jsx

## File Structure

```
Frontend-1/auction-client/src/
├── components/
│   ├── UserProfile.jsx          # NEW - Profile page
│   ├── AuctionList.jsx
│   └── ...
├── contexts/
│   └── AuthContext.jsx          # MODIFIED - Added setUser
└── App.jsx                      # MODIFIED - Added navigation

Backend-1/src/main/
├── api/
│   └── controllers/
│       └── AuthController.java  # MODIFIED - Added update endpoint
└── util/
    └── DatabaseManager.java     # MODIFIED - Added update methods
```

## API Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | No | Create new account |
| `/api/auth/login` | POST | No | User login |
| `/api/auth/verify` | POST | No | Verify token |
| `/api/auth/update-profile` | PUT | Yes | Update user profile |

## Support

For issues or questions about the profile feature:
1. Check browser console for errors
2. Verify backend is running on port 8081
3. Check Authorization header is being sent
4. Verify token is valid and not expired
5. Check database for updated values
