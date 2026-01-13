
import React, { useState } from 'react';
import { AuthMode, User } from '../types';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || (mode === 'register' && !nickname)) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const isAdmin = username.toLowerCase() === 'admin' && password === 'admin123';
    
    const mockUser: User = {
      id: isAdmin ? 'admin-id' : Math.random().toString(36).substr(2, 9),
      username,
      nickname: isAdmin ? 'مدير النظام' : (mode === 'register' ? nickname : username),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      status: 'online',
      role: isAdmin ? 'admin' : 'user'
    };

    onAuthSuccess(mockUser);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-500">
      <div className="mt-16 mb-12 text-center animate-in fade-in zoom-in duration-700">
        <div className="w-20 h-20 bg-red-600 rounded-[28px] mx-auto flex items-center justify-center text-4xl shadow-2xl shadow-red-500/20 mb-6 font-black text-white">
          🇮🇶
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">شات ريل العراق</h1>
        <p className="text-slate-400 dark:text-slate-500 text-sm font-bold tracking-tight">أهلاً بك في أكبر مجتمع عراقي</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-all duration-500">
        <div className="flex mb-8 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all duration-300 ${mode === 'login' ? 'bg-white dark:bg-slate-700 shadow-lg text-red-600 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
          >
            تسجيل دخول
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all duration-300 ${mode === 'register' ? 'bg-white dark:bg-slate-700 shadow-lg text-red-600 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
          >
            إنشاء حساب
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mr-2">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-red-500 rounded-2xl px-5 py-4 text-sm outline-none transition-all dark:text-white font-bold"
              placeholder="admin أو اسمك"
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mr-2">الاسم المستعار</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-red-500 rounded-2xl px-5 py-4 text-sm outline-none transition-all dark:text-white font-bold"
                placeholder="ابن الرافدين"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mr-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-red-500 rounded-2xl px-5 py-4 text-sm outline-none transition-all dark:text-white font-bold"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-[10px] text-center font-black animate-bounce">{error}</p>}

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-600/20 transition-all active:scale-95 mt-4"
          >
            {mode === 'login' ? 'ابدأ الدردشة الآن' : 'تفعيل الحساب'}
          </button>
        </form>
      </div>
      
      <div className="mt-auto py-8 text-center">
        <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black tracking-widest uppercase">
          Real Iraq Chat • Professional Edition 2025
        </p>
      </div>
    </div>
  );
};
