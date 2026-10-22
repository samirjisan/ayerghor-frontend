import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { TOKEN_KEY, USER_KEY } from '../../../api/axiosClient';
import { fetchMe, loginUser, logoutUser, registerUser } from '../api/authApi';

export const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const saveSession = useCallback(({ user: u, token }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // on page refresh: verify the saved token is still valid
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((u) => {
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        setUser(u);
      })
      .catch(clearSession)
      .finally(() => setLoading(false));
  }, [clearSession]);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    saveSession(data);
    return data.user;
  };

  const register = async (payload) => {
    const data = await registerUser(payload);
    saveSession(data);
    return data.user;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      clearSession();
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isAdmin: user?.role === 'super_admin',
      isCustomer: user?.role === 'customer' || user?.role === 'reseller',
      isReseller: user?.role === 'reseller',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
