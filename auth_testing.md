# Auth Testing Playbook (Emergent Google OAuth)

## Create test session via Mongo
```
mongosh "$MONGO_URL" --eval "
use('test_database');
var userId = 'user_test_' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Test:
- GET /api/auth/me with `Cookie: session_token=...`
- All queries must use `{"_id": 0}` projection
- Backend reads `session_token` from cookies first, then Authorization header

Success: /api/auth/me returns user JSON with user_id
Failure: 401 or "User not found"
