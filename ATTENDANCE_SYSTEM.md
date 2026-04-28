# Attendance System Integration

Complete attendance system for retail sales staff with mobile app and web admin dashboard.

## Features

### Mobile App (React Native)
- Login authentication for SALES role
- Clock In/Out with selfie photo
- GPS location tracking
- Real-time location updates every 5 minutes
- Attendance history with photos
- Address reverse geocoding

### Web Admin Dashboard
- Real-time sales location monitoring
- Interactive map with OpenStreetMap
- Sales team status (Active/Clocked Out/Not Started)
- Clock in/out times and locations
- Auto-refresh every 30 seconds

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (returns JWT token)

### Attendance (SALES role only)
- `POST /api/attendance/clock` - Clock in/out with photo and GPS
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/history` - Get last 30 days attendance

### Location Tracking (SALES role only)
- `POST /api/location/track` - Send GPS location update

### Admin (ADMIN/MANAGER role)
- `GET /api/admin/sales-locations` - Get all sales locations and status

## Database Schema

### Attendance Model
```prisma
model Attendance {
  id          String         @id @default(uuid())
  userId      String
  user        User           @relation(fields: [userId], references: [id])
  type        AttendanceType // CLOCK_IN | CLOCK_OUT
  photo       String         // Selfie photo URL
  latitude    Float
  longitude   Float
  address     String?
  accuracy    Float?
  createdAt   DateTime       @default(now())
}
```

### Location Model
```prisma
model Location {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  latitude  Float
  longitude Float
  accuracy  Float?
  createdAt DateTime @default(now())
}
```

## Test Credentials

```
Sales User:
Email: sales@pos.com
Password: sales123

Admin User:
Email: admin@pos.com
Password: admin123
```

## Mobile App Setup

1. Navigate to mobile app directory:
```bash
cd C:/script/attendance-system/mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Update API URL in `src/services/api.js`:
```javascript
const API_URL = 'http://YOUR_SERVER_IP:3000/api';
```

4. Run development:
```bash
npm start
```

5. Build APK:
```bash
eas build --platform android --profile preview
```

## Web Admin Access

Navigate to: `http://localhost:3000/sales-tracking`

Login with admin credentials to view real-time sales locations.

## File Structure

```
pos-app/
├── app/
│   ├── api/
│   │   ├── attendance/
│   │   │   ├── clock/route.ts
│   │   │   ├── today/route.ts
│   │   │   └── history/route.ts
│   │   ├── location/
│   │   │   └── track/route.ts
│   │   └── admin/
│   │       └── sales-locations/route.ts
│   └── (dashboard)/
│       └── sales-tracking/page.tsx
├── prisma/
│   └── schema.prisma (with Attendance & Location models)
└── public/
    └── uploads/
        └── attendance/ (selfie photos)
```

## Next Steps

1. Start the backend server:
```bash
cd C:/script/pos-app
npm run dev
```

2. Test mobile app in development mode
3. Build APK for production
4. Distribute to sales team
