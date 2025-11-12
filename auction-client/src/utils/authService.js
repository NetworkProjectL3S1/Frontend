// Authentication service for Java backend integration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Simple built-in mock user for local development/testing when backend is not available
const MOCK_USER = {
  username: 'demo_user',
  password: 'demo_pass',
  email: 'demo@example.com',
  role: 'BUYER',
  token: 'MOCK_TOKEN_DEMO'
}

/**
 * Login user with username and password
 */
export async function login(username, password) {
  // Local mock shortcut: allow demo_user/demo_pass without contacting backend
  if (username === MOCK_USER.username && password === MOCK_USER.password) {
    localStorage.setItem('authToken', MOCK_USER.token);
    localStorage.setItem('user', JSON.stringify({ username: MOCK_USER.username, email: MOCK_USER.email, role: MOCK_USER.role }));
    return { success: true, user: { username: MOCK_USER.username, email: MOCK_USER.email, role: MOCK_USER.role }, token: MOCK_USER.token };
  }
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
  // If registering the demo account locally, short-circuit for convenience
  if (username === MOCK_USER.username) {
    localStorage.setItem('authToken', MOCK_USER.token);
    localStorage.setItem('user', JSON.stringify({ username: MOCK_USER.username, email: MOCK_USER.email, role: MOCK_USER.role }));
    return { success: true, user: { username: MOCK_USER.username, email: MOCK_USER.email, role: MOCK_USER.role }, token: MOCK_USER.token };
  }
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

  // Accept mock token locally without contacting backend
  if (token === MOCK_USER.token) {
    return { valid: true, user: { username: MOCK_USER.username, email: MOCK_USER.email, role: MOCK_USER.role } };
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

