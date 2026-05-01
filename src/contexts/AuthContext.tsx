import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole; // Actual role (admin or user)
  activeRole: UserRole; // Current active role (for admin switching)
  email?: string;
  createdAt: string;
  // Profile fields
  language?: string;
  phoneNumber?: string;
  position?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean | null;
  isAdmin: boolean;
  needsSetup: boolean | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>, password: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  deleteUser: (userId: string) => Promise<void>;
  switchRole: () => Promise<void>;
  updateAnyUserProfile: (selectedUser: User, updates: Partial<User>) => Promise<void>;
  resetUserPassword: (selectedUser: User, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'current_user';
const USERS_DB_KEY = 'users_database';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    const run = async () => {
      await checkSetupStatus();
    }
    run();
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Always clear any persisted session on launch - forces re-login
      await SecureStore.deleteItemAsync(CURRENT_USER_KEY);
      setIsAuthenticated(false);

      // Check if any users exist in db
      const dbJson = await SecureStore.getItemAsync(USERS_DB_KEY);
      if (!dbJson) { 
        setNeedsSetup(true);
      } else {
        const dbArray = JSON.parse(dbJson);
        const db = new Map(dbArray);
        setNeedsSetup(db.size === 0); // Need setup if no users (ie db empty)
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
      setNeedsSetup(true); 
      setIsAuthenticated(false);
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

  // only available to admins
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
    const updatedUser = { ...userEntry.user, ...updates, activeRole: userEntry.user.role };
    userEntry.user = updatedUser;
    
    db.set(currentUser.username, userEntry);
    await saveUsersDatabase(db);
    
    setCurrentUser(updatedUser);
    await SecureStore.setItemAsync(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  };

  // Allows admins to change roles of other users (switch from admin to user and vice versa)
  const updateAnyUserProfile = async (selectedUser: User, updates: Partial<User>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admin can update other user profiles');
    }

    try {
      const db = await getUsersDatabase();
      const userEntry = db.get(selectedUser.username);

      if (!userEntry) {
        throw new Error('User not found');
      }

      // Prevent changing username or id
      delete updates.id;
      delete updates.createdAt;
      delete updates.username;

      const updatedUser = { ...userEntry.user, ...updates };
      userEntry.user = updatedUser;

      db.set(selectedUser.username, userEntry);
      await saveUsersDatabase(db);

      console.log(`✅ Updated user ${selectedUser.displayName || selectedUser.username} profile`);

    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  /**
   * Reset any user's password (admin only)
   * Does not require old password
   */
  const resetUserPassword = async (selectedUser: User, newPassword: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admin can reset other user passwords');
    }

    try {
      const db = await getUsersDatabase();
      const userEntry = db.get(selectedUser.username);

      if (!userEntry) {
        throw new Error('User not found');
      }

      const newPasswordHash = await hashPassword(newPassword);
      userEntry.passwordHash = newPasswordHash;

      db.set(selectedUser.username, userEntry);
      await saveUsersDatabase(db);

      console.log(`🔐 Password reset for user ${selectedUser.displayName || selectedUser.username} at ${new Date().toISOString()}`);
    }catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
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
        switchRole,
        updateAnyUserProfile,
        resetUserPassword
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