import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole; // Actual role (admin or user)
  activeRole?: UserRole; // Current active role (for admin switching)
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
  needsSetup: boolean | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>, password: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  deleteUser: (userId: string) => Promise<void>;
  switchRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'current_user';
const USERS_DB_KEY = 'users_database';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  console.log('current user,', currentUser?.displayName, currentUser?.username, currentUser?.id)

  const checkSetupStatus = async () => {
    try {
      // Check if current user exists
      const userJson = await SecureStore.getItemAsync(CURRENT_USER_KEY);
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setNeedsSetup(false);
        return;
      }

      // Check if any users exist
      const dbJson = await SecureStore.getItemAsync(USERS_DB_KEY);
      if (!dbJson) {
        setNeedsSetup(true); // No users exist - need setup
      } else {
        const dbArray = JSON.parse(dbJson);
        const db = new Map(dbArray);
        setNeedsSetup(db.size === 0); // Need setup if no users
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
      setNeedsSetup(true); // Assume setup needed on error
    }
  };

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
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
    return hash;
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

      const userWithActiveRole = {
          ...userEntry.user,
          activeRole: userEntry.user.role
      };

      // Login successful
      setCurrentUser(userWithActiveRole);
      setIsAuthenticated(true);
      await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(userWithActiveRole));
      
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
    // Allow creating first user without being logged in
    const isFirstUser = needsSetup === true;
    
    if (!isFirstUser && (!currentUser || currentUser.role !== 'admin')) {
      throw new Error('Only admin can create users');
    }

    const db = await getUsersDatabase();
    
    // Check if username already exists
    if (db.has(userData.username)) {
      throw new Error('Username already exists');
    }

    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}`, // TODO - change to site-date?
      createdAt: new Date().toISOString()
    };

    const passwordHash = await hashPassword(password);
    db.set(newUser.username, { user: newUser, passwordHash });
    
    await saveUsersDatabase(db);

    // If this was the first user, update setup status
    if (isFirstUser) {
      setNeedsSetup(false);
    }
  };

  const switchRole = async () => {
        if (!currentUser || currentUser.role !== 'admin') {
            console.warn('Only admins can switch roles');
            return;
        }

        const newActiveRole: UserRole = currentUser.activeRole === 'admin' ? 'user' : 'admin';
        const updatedUser: User = { ...currentUser, activeRole: newActiveRole };
        
        setCurrentUser(updatedUser);
        await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(updatedUser));
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
        needsSetup,
        login,
        logout,
        createUser,
        updateUserProfile,
        getAllUsers,
        deleteUser,
        switchRole
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