import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Usuário ADM padrão inicial
const DEFAULT_ADMIN = {
  id: '1',
  name: 'Administrador',
  email: 'admin@coffeti.com',
  password: 'admin123',
  role: 'admin'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('@SoloCerto:session');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('@SoloCerto:users');
    if (saved) {
      try { return JSON.parse(saved); } catch { return [DEFAULT_ADMIN]; }
    }
    return [DEFAULT_ADMIN];
  });

  useEffect(() => {
    localStorage.setItem('@SoloCerto:users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('@SoloCerto:session', JSON.stringify(user));
    } else {
      localStorage.removeItem('@SoloCerto:session');
    }
  }, [user]);

  const login = (email, password) => {
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...safeUser } = found;
      setUser(safeUser);
      return { success: true };
    }
    return { success: false, error: 'E-mail ou senha incorretos.' };
  };

  const logout = () => {
    setUser(null);
  };

  const createUser = (name, email, password, role = 'user', trialDays = 0) => {
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Apenas administradores podem criar contas.' };
    }
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Já existe um usuário com este e-mail.' };
    }
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role,
      trialDays: Number(trialDays),
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    return { success: true };
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, users, isAuthenticated, isAdmin, login, logout, createUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
