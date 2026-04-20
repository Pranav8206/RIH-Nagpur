"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

axios.defaults.baseURL = API_BASE_URL;

axios.interceptors.request.use((config) => {
  const storedToken =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  if (storedToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${storedToken}`;
  }

  return config;
});

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    if (storedToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }

    return storedToken;
  });
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("authToken", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("authToken");
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const startTime = Date.now();

      if (!token) {
        setUser(null);
      } else {
        try {
          const response = await axios.get("/users/profile");
          const currentUser = response?.data?.data || null;
          if (isMounted) {
            setUser(currentUser);
          }
        } catch (err) {
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      }

      const elapsed = Date.now() - startTime;
      const minimumDelay = 900;
      const waitMs = Math.max(0, minimumDelay - elapsed);

      setTimeout(() => {
        if (isMounted) {
          setAuthReady(true);
        }
      }, waitMs);
    };

    setAuthReady(false);
    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const setAuth = useCallback(({ token: nextToken, user: nextUser }) => {
    setToken(nextToken || null);
    setUser(nextUser || null);
    setError(null);
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await axios.post("/users/logout");
      }
    } catch (err) {
      // Logout should always clear client auth state even if server call fails.
    } finally {
      clearAuth();
    }
  }, [token, clearAuth]);

  const deleteAccount = useCallback(async () => {
    await axios.delete("/users/profile");
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      axiosInstance: axios,
      token,
      setToken,
      user,
      setUser,
      loading,
      setLoading,
      error,
      setError,
      setAuth,
      clearAuth,
      logout,
      deleteAccount,
      isAuthenticated: Boolean(token),
      authReady,
      apiBaseUrl: API_BASE_URL,
    }),
    [
      token,
      user,
      loading,
      error,
      authReady,
      setAuth,
      clearAuth,
      logout,
      deleteAccount,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
