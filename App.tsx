
import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { ChatRoom } from './components/ChatRoom';
import { User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('chat_real_iraq_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('chat_real_iraq_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('chat_real_iraq_user');
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-200 dark:border-red-900 border-t-red-600 rounded-full animate-spin"></div>
          <div className="mt-6 text-center">
            <h2 className="text-xl font-black text-slate-800 dark:text-white animate-pulse">شات ريل العراق</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-2">جاري تهيئة البيئة...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-white dark:bg-slate-900 shadow-2xl relative overflow-hidden flex flex-col transition-colors duration-500">
      {currentUser ? (
        <ChatRoom 
          user={currentUser} 
          onLogout={handleLogout} 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme} 
        />
      ) : (
        <Auth onAuthSuccess={handleLogin} />
      )}
    </div>
  );
};

export default App;
