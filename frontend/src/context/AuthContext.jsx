import React, { createContext, useState, useEffect } from 'react';
import { loginApi, registerApi, googleAuthApi, confirmGoogleRoleApi, getMeApi, logoutApi } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('cardalink_token') || null);
  const [loading, setLoading] = useState(true);

  // Helper to set active token, user profile, and permissions in Context & localStorage
  const setAuthSession = (tokenVal, userData) => {
    localStorage.setItem('cardalink_token', tokenVal);
    setToken(tokenVal);
    setUser(userData);
    setPermissions(userData.permissions || []);
  };

  // Load user profile & IAM permissions if token exists on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('cardalink_token');
      if (storedToken) {
        try {
          const response = await getMeApi();
          if (response.success && response.data?.user) {
            setUser(response.data.user);
            setPermissions(response.data.user.permissions || []);
            setToken(storedToken);
          } else {
            handleLocalLogout();
          }
        } catch (error) {
          console.warn('Stored IAM session invalid or expired:', error.message);
          handleLocalLogout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleLocalLogout = () => {
    localStorage.removeItem('cardalink_token');
    setToken(null);
    setUser(null);
    setPermissions([]);
  };

  const login = async (email, password) => {
    try {
      const response = await loginApi({ email, password });
      if (response.success && response.data) {
        const { user: userData, token: newToken } = response.data;
        setAuthSession(newToken, userData);
        return { success: true, role: userData.role, message: response.message };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.message || 'Invalid email or password' };
    }
  };

  const googleAuth = async (googleData) => {
    try {
      const response = await googleAuthApi(googleData);
      if (response.success && response.data) {
        if (response.data.requiresRoleSelection) {
          return {
            success: true,
            requiresRoleSelection: true,
            email: response.data.email,
            name: response.data.name,
            googleSub: response.data.googleSub,
          };
        }
        const { user: userData, token: newToken } = response.data;
        setAuthSession(newToken, userData);
        return { success: true, role: userData.role, message: response.message };
      }
      return { success: false, message: response.message || 'Google login failed' };
    } catch (error) {
      return { success: false, message: error.message || 'Google authentication failed' };
    }
  };

  const confirmGoogleRole = async (payload) => {
    try {
      const response = await confirmGoogleRoleApi(payload);
      if (response.success && response.data) {
        const { user: userData, token: newToken } = response.data;
        setAuthSession(newToken, userData);
        return { success: true, role: userData.role, message: response.message };
      }
      return { success: false, message: response.message || 'Failed to complete registration' };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to complete registration' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerApi(userData);
      return {
        success: response.success,
        message: response.message || 'Registration successful',
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutApi().catch(() => {});
      }
    } finally {
      handleLocalLogout();
      window.scrollTo(0, 0);
    }
  };

  const hasPermission = (permissionName) => {
    if (!permissionName) return false;
    return permissions.includes(permissionName);
  };

  const hasRole = (roleName) => {
    if (!roleName || !user?.role) return false;
    return user.role.toUpperCase() === roleName.toUpperCase();
  };

  const value = {
    user,
    token,
    permissions,
    isAuthenticated: !!user,
    role: user?.role || null,
    loading,
    login,
    register,
    googleAuth,
    confirmGoogleRole,
    setAuthSession,
    logout,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

