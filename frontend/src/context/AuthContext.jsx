// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // true until auth ready

    useEffect(() => {
        const initializeAuth = async () => {
            const token = sessionStorage.getItem('token');
            const storedUser = sessionStorage.getItem('user');

            if (token) {
                try {
                    const res = await apiClient.get('/users/me');
                    const userData = res.data.user;
                    if (userData) {
                        setUser(userData);
                        sessionStorage.setItem('user', JSON.stringify(userData));
                    } else if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                } catch (err) {
                    console.error('Auth initialization failed:', err);
                    if (err.response?.status === 401) {
                        sessionStorage.removeItem('token');
                        sessionStorage.removeItem('user');
                        setUser(null);
                    } else if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const refreshUser = async () => {
        try {
            const res = await apiClient.get('/users/me');
            const freshUser = res.data.user;
            if (freshUser) {
                setUser(freshUser);
                sessionStorage.setItem('user', JSON.stringify(freshUser));
                return freshUser;
            }
        } catch (err) {
            console.error('Failed to refresh user data:', err);
            // Don't set user to null on generic fetch error to avoid logging out
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        const res = await apiClient.post('/auth/login', { email, password });
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setLoading(false);
        return res.data;
    };

    const register = async (userData) => {
        setLoading(true);
        const res = await apiClient.post('/auth/register', userData);
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setLoading(false);
        return res.data;
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// ✅ Named export for hook
export const useAuth = () => useContext(AuthContext);