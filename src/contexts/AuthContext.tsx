import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  email?: string;
  createdAt: string;
  // Profile fields
  language?: string;
  phoneNumber?: string;
  position?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>, password: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'current_user';
const USERS_DB_KEY = 'users_database';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userJson = await SecureStore.getItemAsync(CURRENT_USER_KEY);
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const hashPassword = async (password: string): Promise<string> => {
    // Simple hash for offline use
    // In production, use a proper hashing library like bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const getUsersDatabase = async (): Promise<Map<string, { user: User; passwordHash: string }>> => {
    try {
      const dbJson = await SecureStore.getItemAsync(USERS_DB_KEY);
      if (dbJson) {
        const dbArray = JSON.parse(dbJson);
        return new Map(dbArray);
      }
    } catch (error) {
      console.error('Error loading users database:', error);
    }
    return new Map();
  };

  const saveUsersDatabase = async (db: Map<string, { user: User; passwordHash: string }>) => {
    const dbArray = Array.from(db.entries());
    await SecureStore.setItemAsync(USERS_DB_KEY, JSON.stringify(dbArray));
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const db = await getUsersDatabase();
      const userEntry = db.get(username);

      if (!userEntry) {
        return false;
      }

      const passwordHash = await hashPassword(password);
      if (passwordHash !== userEntry.passwordHash) {
        return false;
      }

      // Login successful
      setCurrentUser(userEntry.user);
      setIsAuthenticated(true);
      await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(userEntry.user));
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    await SecureStore.deleteItemAsync(CURRENT_USER_KEY);
  };

  const createUser = async (
    userData: Omit<User, 'id' | 'createdAt'>,
    password: string
  ) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admin can create users');
    }

    const db = await getUsersDatabase();
    
    // Check if username already exists
    if (db.has(userData.username)) {
      throw new Error('Username already exists');
    }

    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const passwordHash = await hashPassword(password);
    db.set(newUser.username, { user: newUser, passwordHash });
    
    await saveUsersDatabase(db);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    const db = await getUsersDatabase();
    const userEntry = db.get(currentUser.username);
    
    if (!userEntry) {
      throw new Error('User not found');
    }

    // Users can only update their own profile
    // Admins can update role/username of others, but that requires separate method
    const updatedUser = { ...userEntry.user, ...updates };
    userEntry.user = updatedUser;
    
    db.set(currentUser.username, userEntry);
    await saveUsersDatabase(db);
    
    setCurrentUser(updatedUser);
    await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  };

  const getAllUsers = async (): Promise<User[]> => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admin can view all users');
    }

    const db = await getUsersDatabase();
    return Array.from(db.values()).map(entry => entry.user);
  };

  const deleteUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admin can delete users');
    }

    const db = await getUsersDatabase();
    const entries = Array.from(db.entries());
    const entryToDelete = entries.find(([_, entry]) => entry.user.id === userId);
    
    if (entryToDelete) {
      db.delete(entryToDelete[0]);
      await saveUsersDatabase(db);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin: currentUser?.role === 'admin',
        login,
        logout,
        createUser,
        updateUserProfile,
        getAllUsers,
        deleteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};