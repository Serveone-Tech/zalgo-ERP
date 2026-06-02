# Zalgo Infotech ERP — Mobile App Setup (React Native / Expo)

## Backend API Base URL
- Development: `http://YOUR_PC_IP:5000`  (e.g. `http://192.168.1.5:5000`)
- Production:  `https://erp.zalgostore.com`

---

## 1. Create Expo Project

```bash
npx create-expo-app ZalgoMobile --template blank-typescript
cd ZalgoMobile
```

## 2. Install Required Packages

```bash
npx expo install expo-secure-store expo-constants
npm install @tanstack/react-query axios zustand
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

## 3. API Client (api.ts)

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://erp.zalgostore.com'; // ya localhost IP dev mein

export const api = axios.create({ baseURL: API_URL });

// Har request ke saath JWT token attach karo
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 pe auto refresh karo
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = await SecureStore.getItemAsync('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/mobile/refresh`, { refreshToken: refresh });
          await SecureStore.setItemAsync('jwt_token', data.token);
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return axios(error.config);
        } catch {
          await SecureStore.deleteItemAsync('jwt_token');
          await SecureStore.deleteItemAsync('refresh_token');
          // Navigate to login
        }
      }
    }
    return Promise.reject(error);
  }
);
```

## 4. Authentication (auth.ts)

```typescript
import { api } from './api';
import * as SecureStore from 'expo-secure-store';

// Admin / Staff Login
export async function loginAdmin(email: string, password: string) {
  const { data } = await api.post('/api/auth/mobile/login', { email, password });
  await SecureStore.setItemAsync('jwt_token', data.token);
  await SecureStore.setItemAsync('refresh_token', data.refreshToken);
  return data.user;
}

// Student Login (same endpoint, role = "student")
export async function loginStudent(email: string, password: string) {
  return loginAdmin(email, password); // Same API, different role
}

// Student Register (enrollment number + password)
export async function registerStudent(enrollmentNo: string, password: string) {
  const { data } = await api.post('/api/student-portal/register', { enrollmentNo, password });
  return data;
}

export async function logout() {
  await SecureStore.deleteItemAsync('jwt_token');
  await SecureStore.deleteItemAsync('refresh_token');
}

export async function getMe() {
  const { data } = await api.get('/api/auth/mobile/me');
  return data;
}
```

## 5. Available API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/mobile/login` | Login → returns `{ token, refreshToken, user }` |
| POST | `/api/auth/mobile/refresh` | Refresh token → returns `{ token }` |
| GET  | `/api/auth/mobile/me` | Current user info |

### Student Portal (role = "student")
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/student-portal/register` | Register with `{ enrollmentNo, password }` |
| GET  | `/api/student-portal/dashboard` | Dashboard stats |
| GET  | `/api/student-portal/attendance` | Attendance records |
| GET  | `/api/student-portal/exams` | Exam results |
| GET  | `/api/student-portal/fees` | Fee payments & installments |
| GET  | `/api/student-portal/live-classes` | Live & past classes |
| GET  | `/api/student-portal/live-classes/:id/join` | Join live class → `{ roomUrl, token }` |

### Admin / Staff
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/students` | Student list |
| GET  | `/api/leads` | Leads list |
| GET  | `/api/courses` | Courses |
| GET  | `/api/fees` | Fee records |
| GET  | `/api/live-classes` | Live classes list |
| POST | `/api/live-classes` | Schedule class |
| POST | `/api/live-classes/:id/start` | Start class |
| POST | `/api/live-classes/:id/end` | End class |

## 6. All requests mein Authorization header

```typescript
// Sab requests automatically JWT attach honge (interceptor se)
const students = await api.get('/api/students');
const dashboard = await api.get('/api/student-portal/dashboard');
```

## 7. Role-based Navigation

```typescript
const user = await getMe();

if (user.role === 'student') {
  // Student Portal screens
} else if (user.role === 'admin' || user.role === 'staff') {
  // Admin Panel screens
}
```

---

## Important Notes

1. **JWT Token** 7 din tak valid rahega, **Refresh Token** 30 din
2. React Native mein cookies kaam nahi karte — hamesha `Authorization: Bearer <token>` use karo
3. Live class joining ke liye `@daily-co/daily-js` ka React Native version use karo ya WebView mein embed karo
4. Production URL: `https://erp.zalgostore.com`
