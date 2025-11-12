// Authentication service for Java backend integration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Login user with username and password
 */
export async function login(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || data.error || data.errorMessage || 'Login failed';
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Handle different Java backend response formats
    const token = data.token || data.accessToken || data.jwt || (data.data && data.data.token);
    const user = data.user || data.data?.user || { username };

    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    }

    return {
      success: true,
      user: user,
      token: token,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network error. Please try again.',
    };
  }
}

/**
 * Register a new user
 */
export async function register(username, password, email = '', role = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, email, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || data.error || data.errorMessage || 'Registration failed';
      return {
        success: false,
        error: errorMessage,
      };
    }

    const token = data.token || data.accessToken || data.jwt || (data.data && data.data.token);
    const user = data.user || data.data?.user || { username };

    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    }

    return {
      success: true,
      user: user,
      token: token,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network error. Please try again.',
    };
  }
}

/**
 * Logout user
 */
export function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}

/**
 * Get stored authentication token
 */
export function getToken() {
  return localStorage.getItem('authToken');
}

/**
 * Get stored user data
 */
export function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Verify token with backend
 */
export async function verifyToken() {
  const token = getToken();
  if (!token) {
    return { valid: false };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      logout();
      return { valid: false };
    }

    const data = await response.json();
    const user = data.user || data.data?.user || data;
    return {
      valid: true,
      user: user,
    };
  } catch (error) {
    logout();
    return { valid: false };
  }
}

