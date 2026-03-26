import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api';

// ── Authenticated API Instance ────────────────────────────────────────────────
// يُستخدم للطلبات المحمية التي تتطلب تسجيل دخول
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor لإضافة الـ token تلقائياً مع كل request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor للتعامل مع الأخطاء (مثل انتهاء الـ session)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // إذا انتهت الجلسة، امسح البيانات وارجع للـ login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Public API Instance ───────────────────────────────────────────────────────
// يُستخدم للطلبات العامة التي لا تتطلب تسجيل دخول (مثل تصفح المواد)
// لا يُضيف Auth header ولا يعيد توجيه المستخدم عند خطأ 401
export const publicApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor بسيط للـ publicApi - فقط للتعامل مع الأخطاء بدون إعادة توجيه
publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // لا نعيد توجيه المستخدم للـ login - فقط نرجع الخطأ
    console.warn('Public API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;
