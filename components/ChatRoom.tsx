
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, VoiceSlot, Room, AppSettings } from '../types';
import { getAiResponse } from '../services/gemini';

interface ChatRoomProps {
  user: User;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ user, onLogout, isDarkMode, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'admin' | 'settings' | 'chat'>('rooms');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  
  const [editUser, setEditUser] = useState<User>(() => {
    const saved = localStorage.getItem('chat_real_iraq_user');
    return saved ? JSON.parse(saved) : user;
  });
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('iraq_chat_settings_v6');
    return saved ? JSON.parse(saved) : {
      appName: 'شات ريل العراق',
      appSlogan: 'أكبر منصة دردشة عراقية متطورة',
      appLogo: '🇮🇶',
      headerColor: 'bg-violet-950',
      backgroundUrl: ''
    };
  });

  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('chat_history_v9');
    return saved ? JSON.parse(saved) : { 'main': [] };
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('chat_rooms_v9');
    return saved ? JSON.parse(saved) : [
      { id: 'main', name: 'مجلس العراق', description: 'الغرفة الرئيسية للدردشة العامة', icon: '🏰', createdBy: 'admin', onlineCount: 150 },
      { id: 'baghdad', name: 'ردهة بغداد', description: 'أهلنا في العاصمة بغداد', icon: '🌴', createdBy: 'admin', onlineCount: 85 }
    ];
  });

  const [voiceSlots, setVoiceSlots] = useState<VoiceSlot[]>(() => {
    const saved = localStorage.getItem('voice_slots_v10');
    return saved ? JSON.parse(saved) : [
      { id: '1', userId: null, userName: null, userAvatar: null, isSpeaking: false, isMutedByAdmin: false, isLocalMuted: false },
      { id: '2', userId: null, userName: null, userAvatar: null, isSpeaking: false, isMutedByAdmin: false, isLocalMuted: false },
      { id: '3', userId: null, userName: null, userAvatar: null, isSpeaking: false, isMutedByAdmin: false, isLocalMuted: false }
    ];
  });

  const [verifiedUsers, setVerifiedUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem('verified_users_v9');
    return saved ? JSON.parse(saved) : ['admin-id'];
  });

  const [bannedUsers, setBannedUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem('banned_users_v6');
    return saved ? JSON.parse(saved) : [];
  });

  const [mutedUsers, setMutedUsers] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isLocalMicMuted, setIsLocalMicMuted] = useState(false);

  const pressTimerRef = useRef<number | null>(null);
  const [showSlotActionId, setShowSlotActionId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const isAdmin = editUser.role === 'admin';

  useEffect(() => {
    if (bannedUsers.includes(editUser.id)) {
      alert("لقد تم حظرك نهائياً.");
      onLogout();
    }
  }, [bannedUsers, editUser.id, onLogout]);

  useEffect(() => {
    localStorage.setItem('chat_history_v9', JSON.stringify(messages));
    localStorage.setItem('chat_rooms_v9', JSON.stringify(rooms));
    localStorage.setItem('voice_slots_v10', JSON.stringify(voiceSlots));
    localStorage.setItem('verified_users_v9', JSON.stringify(verifiedUsers));
    localStorage.setItem('iraq_chat_settings_v6', JSON.stringify(appSettings));
    localStorage.setItem('banned_users_v6', JSON.stringify(bannedUsers));
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, rooms, voiceSlots, verifiedUsers, appSettings, bannedUsers]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRoomId) return;
    if (!inputText.trim() && !pendingImage) return;
    if (mutedUsers.includes(editUser.id)) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: editUser.id,
      senderName: editUser.nickname,
      senderAvatar: editUser.avatar,
      text: inputText,
      imageUrl: pendingImage || undefined,
      timestamp: Date.now(),
      isVerifiedSender: verifiedUsers.includes(editUser.id)
    };

    setMessages(prev => ({ ...prev, [activeRoomId]: [...(prev[activeRoomId] || []), newMessage] }));
    setInputText('');
    setPendingImage(null);

    if (inputText.includes('بوت')) {
      setIsTyping(true);
      const res = await getAiResponse(inputText);
      setMessages(prev => ({
        ...prev,
        [activeRoomId]: [...(prev[activeRoomId] || []), {
          id: (Date.now() + 1).toString(),
          senderId: 'ai',
          senderName: 'المشرف الذكي',
          senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=iraq',
          text: res,
          timestamp: Date.now(),
          isAi: true,
          isVerifiedSender: true
        }]
      }));
      setIsTyping(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'chat') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'profile') setEditUser(prev => ({ ...prev, avatar: base64 }));
        else setPendingImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminAction = (msg: Message, action: 'delete' | 'mute' | 'verify' | 'ban') => {
    if (!isAdmin) return;
    const currentRoom = activeRoomId || 'main';
    switch (action) {
      case 'delete':
        setMessages(prev => ({ ...prev, [currentRoom]: prev[currentRoom].filter(m => m.id !== msg.id) }));
        break;
      case 'mute':
        setMutedUsers(prev => prev.includes(msg.senderId) ? prev.filter(id => id !== msg.senderId) : [...prev, msg.senderId]);
        break;
      case 'verify':
        setVerifiedUsers(prev => prev.includes(msg.senderId) ? prev.filter(id => id !== msg.senderId) : [...prev, msg.senderId]);
        break;
      case 'ban':
        if (msg.senderId !== editUser.id && confirm(`حظر ${msg.senderName} نهائياً؟`)) {
          setBannedUsers(prev => [...prev, msg.senderId]);
        }
        break;
    }
    setSelectedMessage(null);
  };

  const handleJoinSlot = async (slotId: string) => {
    if (voiceSlots.some(s => s.userId === editUser.id)) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setVoiceSlots(prev => prev.map(s => s.id === slotId ? {
        ...s, userId: editUser.id, userName: editUser.nickname, userAvatar: editUser.avatar, isSpeaking: true
      } : s));
      setIsMicActive(true);
    } catch (err) { alert("الميكروفون مطلوب!"); }
  };

  const handleSaveProfile = () => {
    setSaveStatus('loading');
    localStorage.setItem('chat_real_iraq_user', JSON.stringify(editUser));
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleSlotPressStart = (id: string) => {
    if (!isAdmin) return;
    pressTimerRef.current = window.setTimeout(() => setShowSlotActionId(id), 800);
  };

  const handleSlotPressEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  const isInsideChat = activeTab === 'chat' && activeRoomId !== null;

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'} font-['Cairo'] relative overflow-hidden transition-all duration-500`}>
      
      {/* Header */}
      <header className="bg-violet-950 text-white p-4 flex items-center justify-between z-40 sticky top-0 shadow-2xl border-b border-violet-900">
        <div className="flex items-center gap-3">
          {isInsideChat && (
            <button onClick={() => { setActiveTab('rooms'); setActiveRoomId(null); }} className="p-2 -mr-2 text-violet-300 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-xl shadow-lg border border-violet-400/20 overflow-hidden">
             {appSettings.appLogo.length > 2 ? <img src={appSettings.appLogo} className="w-full h-full object-cover" /> : appSettings.appLogo}
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-sm leading-none">{isInsideChat ? rooms.find(r => r.id === activeRoomId)?.name : appSettings.appName}</h1>
            <span className="text-[9px] text-violet-300 font-bold mt-1 uppercase tracking-widest">{isInsideChat ? 'متصل الآن' : appSettings.appSlogan}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center bg-violet-900/50 rounded-lg border border-violet-800 text-lg">{isDarkMode ? '🌙' : '☀️'}</button>
          {isAdmin && !isInsideChat && <button onClick={() => setActiveTab('admin')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${activeTab === 'admin' ? 'bg-violet-500 shadow-lg' : 'bg-violet-900/50'}`}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg></button>}
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {isInsideChat ? (
          <div className="flex flex-col h-full relative" style={{ backgroundImage: appSettings.backgroundUrl ? `url(${appSettings.backgroundUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            
            {/* Voice Platform */}
            <div className="bg-violet-950/40 backdrop-blur-xl p-3 flex gap-4 overflow-x-auto scrollbar-hide border-b border-white/5">
              {voiceSlots.map(slot => (
                <div 
                  key={slot.id} 
                  onMouseDown={() => handleSlotPressStart(slot.id)}
                  onMouseUp={handleSlotPressEnd}
                  onMouseLeave={handleSlotPressEnd}
                  onTouchStart={() => handleSlotPressStart(slot.id)}
                  onTouchEnd={handleSlotPressEnd}
                  onClick={() => !slot.userId && handleJoinSlot(slot.id)} 
                  className={`relative flex-shrink-0 w-14 h-14 rounded-2xl border-2 transition-all flex items-center justify-center cursor-pointer overflow-hidden
                    ${slot.userId ? (slot.isSpeaking ? 'border-violet-500 scale-105 shadow-xl shadow-violet-500/30' : 'border-violet-900 shadow-lg') : 'border-dashed border-white/20'}`}
                >
                  {slot.userId ? (
                    <>
                      <img src={slot.userAvatar || ''} className="w-full h-full object-cover" />
                      {slot.isSpeaking && <div className="absolute inset-0 border-4 border-violet-400/40 rounded-xl animate-ping"></div>}
                    </>
                  ) : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="opacity-30"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>}
                  
                  {showSlotActionId === slot.id && isAdmin && (
                    <div className="absolute inset-0 bg-red-600 flex items-center justify-center z-10 animate-in zoom-in">
                      <button onClick={(e) => { e.stopPropagation(); setVoiceSlots(prev => prev.filter(s => s.id !== slot.id)); setShowSlotActionId(null); }} className="text-[10px] font-black text-white">حذف</button>
                    </div>
                  )}
                </div>
              ))}
              {isMicActive && <button onClick={() => { setIsMicActive(false); setVoiceSlots(prev => prev.map(s => s.userId === editUser.id ? {...s, userId: null, userName: null, userAvatar: null, isSpeaking: false} : s)); }} className="bg-red-600 text-white text-[10px] font-black px-4 rounded-xl shadow-lg h-10 my-auto">نزول</button>}
              {isAdmin && <button onClick={() => setVoiceSlots([...voiceSlots, { id: Date.now().toString(), userId: null, userName: null, userAvatar: null, isSpeaking: false, isMutedByAdmin: false, isLocalMuted: false }])} className="w-14 h-14 shrink-0 rounded-2xl bg-violet-900/50 border-2 border-dashed border-white/20 flex items-center justify-center text-white text-xl font-bold">+</button>}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
              {(messages[activeRoomId] || []).map(msg => {
                const isMe = msg.senderId === editUser.id;
                return (
                  <div key={msg.id} onClick={() => isAdmin && setSelectedMessage(msg)} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-2`}>
                    <div className={`flex items-center gap-2 mb-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                       <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                          <img src={msg.senderAvatar} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex flex-col">
                          <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[11px] font-black dark:text-white drop-shadow-sm">{msg.senderName}</span>
                            {msg.isVerifiedSender && <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>}
                          </div>
                          <span className="text-[8px] text-slate-400 font-bold opacity-60">{new Date(msg.timestamp).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </div>
                    <div className={`max-w-[85%] px-5 py-3 rounded-2xl shadow-xl border transition-all ${isMe ? 'bg-violet-700 text-white border-violet-600 rounded-tr-none' : 'bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white rounded-tl-none'}`}>
                      {msg.imageUrl && <img src={msg.imageUrl} className="rounded-xl mb-2 max-w-full border border-black/5" />}
                      <p className="text-[13px] font-bold leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
              {isTyping && <p className="text-[10px] italic text-violet-400 font-black animate-pulse px-2">جاري الرد...</p>}
            </div>

            {/* Input - Professional Icons */}
            <div className="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t dark:border-slate-800 shadow-2xl">
               {pendingImage && <div className="mb-3 relative inline-block"><img src={pendingImage} className="w-20 h-20 rounded-2xl border-4 border-violet-600 shadow-2xl" /><button onClick={() => setPendingImage(null)} className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-black shadow-lg">✕</button></div>}
               <form onSubmit={handleSendMessage} className="flex gap-3">
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-[24px] flex items-center px-4 border border-transparent focus-within:border-violet-500 transition-all">
                    <button type="button" onClick={() => chatFileRef.current?.click()} className="p-2 text-violet-500 hover:scale-110 transition-transform">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    </button>
                    <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} className="flex-1 bg-transparent py-4 text-sm outline-none dark:text-white font-bold px-2" placeholder="أدخل رسالتك هنا..." />
                    <button type="button" className="p-2 text-violet-500 hover:scale-110 transition-transform">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                    </button>
                    <input type="file" ref={chatFileRef} onChange={e => handleFileUpload(e, 'chat')} className="hidden" accept="image/*" />
                  </div>
                  <button type="submit" className="bg-violet-700 text-white w-14 h-14 rounded-[24px] flex items-center justify-center shadow-xl shadow-violet-700/30 active:scale-90 transition-all">
                     <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="rotate-180 transform -translate-x-0.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  </button>
               </form>
            </div>
          </div>
        ) : activeTab === 'rooms' ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-xl font-black dark:text-white flex items-center gap-2">مجالسنا العربية <span className="text-violet-600">🏛️</span></h3>
               <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[10px] font-black px-3 py-1.5 rounded-full">إجمالي: {rooms.length}</span>
            </div>
            {rooms.map(room => (
              <div key={room.id} onClick={() => { setActiveRoomId(room.id); setActiveTab('chat'); }} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border dark:border-slate-800 flex items-center gap-5 shadow-sm active:scale-[0.98] transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                <div className="w-16 h-16 bg-violet-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl overflow-hidden border dark:border-slate-700 shadow-inner">
                  {room.icon.startsWith('data:') ? <img src={room.icon} className="w-full h-full object-cover" /> : room.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-lg dark:text-white group-hover:text-violet-600 transition-colors">{room.name}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-400"></div>
                     <p className="text-[11px] font-bold text-slate-400">يتواجد الآن: {room.onlineCount}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-violet-600 group-hover:bg-violet-700 group-hover:text-white transition-all shadow-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'settings' ? (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-slate-50 dark:bg-slate-950">
             <div className="relative group mb-8">
                <div className="w-36 h-36 rounded-[48px] border-4 border-violet-600 p-1.5 shadow-2xl bg-white dark:bg-slate-800 overflow-hidden relative">
                  <img src={editUser.avatar} className="w-full h-full rounded-[40px] object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <span className="text-white text-[11px] font-black tracking-widest uppercase">تغيير الصورة 💾</span>
                  </div>
                </div>
                <button onClick={() => profileFileRef.current?.click()} className="absolute -bottom-2 -right-2 bg-violet-700 text-white w-10 h-10 rounded-2xl shadow-xl flex items-center justify-center border-2 border-white dark:border-slate-800"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg></button>
                <input type="file" ref={profileFileRef} onChange={e => handleFileUpload(e, 'profile')} className="hidden" accept="image/*" />
             </div>
             
             <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl border dark:border-slate-800 space-y-6">
                <h4 className="text-[11px] font-black text-violet-600 tracking-widest uppercase flex items-center gap-2">ملفك الشخصي <div className="w-1.5 h-1.5 bg-violet-600 rounded-full"></div></h4>
                <div className="space-y-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-wider">اليوزر نيم</label><input type="text" value={editUser.username} onChange={e => setEditUser({...editUser, username: e.target.value.toLowerCase().replace(/\s/g, '')})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none font-bold text-sm dark:text-white border dark:border-slate-700 focus:border-violet-500 transition-all" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-wider">الاسم المستعار</label><input type="text" value={editUser.nickname} onChange={e => setEditUser({...editUser, nickname: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none font-bold text-sm dark:text-white border dark:border-slate-700 focus:border-violet-500 transition-all" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 px-1 uppercase tracking-wider">النبذة (Bio)</label><textarea value={editUser.bio || ''} onChange={e => setEditUser({...editUser, bio: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none font-bold text-sm dark:text-white border dark:border-slate-700 focus:border-violet-500 transition-all h-24 resize-none" placeholder="اكتب شيئاً عنك..." /></div>
                </div>
                
                {saveStatus === 'success' && <p className="text-green-500 text-[10px] text-center font-black animate-pulse">✓ تم حفظ التغييرات بنجاح</p>}
                
                <button onClick={handleSaveProfile} className="w-full bg-violet-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-violet-700/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                   {saveStatus === 'loading' ? 'جاري الحفظ...' : 'حفظ الملف الشخصي'}
                </button>
                <button onClick={onLogout} className="w-full text-red-500 font-black text-xs py-2 hover:underline">🚪 تسجيل الخروج من النظام</button>
             </div>
          </div>
        ) : activeTab === 'admin' && (
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50 dark:bg-slate-950">
             <div className="flex items-center gap-4 pb-6 border-b-2 border-violet-700/20">
                <div className="w-14 h-14 bg-violet-700 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-violet-700/20">🛡️</div>
                <div>
                   <h2 className="text-2xl font-black dark:text-white tracking-tight">إدارة المنصة</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">تحكم كامل في إعدادات التطبيق</p>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border dark:border-slate-800 shadow-xl space-y-6">
                <h4 className="text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">🎨 تخصيص الواجهة</h4>
                <div className="space-y-4">
                   <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 px-1">اسم الشات</label><input type="text" value={appSettings.appName} onChange={e => setAppSettings({...appSettings, appName: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none font-bold text-sm dark:text-white border dark:border-slate-700" /></div>
                   <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 px-1">رابط خلفية الدردشة (Wallpaper URL)</label><input type="text" value={appSettings.backgroundUrl || ''} onChange={e => setAppSettings({...appSettings, backgroundUrl: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none font-bold text-xs dark:text-white border dark:border-slate-700 text-left" dir="ltr" placeholder="https://..." /></div>
                   <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 px-1">شعار التطبيق (URL or Emoji)</label><input type="text" value={appSettings.appLogo} onChange={e => setAppSettings({...appSettings, appLogo: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none font-bold text-sm dark:text-white border dark:border-slate-700" /></div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border dark:border-slate-800 shadow-xl space-y-6">
                <h4 className="text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">🏛️ إدارة الغرف</h4>
                <div className="space-y-4">
                   {rooms.map(r => (
                     <div key={r.id} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-[24px] border dark:border-slate-700 flex flex-col gap-4">
                        <div className="flex gap-3">
                           <input type="text" value={r.name} onChange={e => setRooms(prev => prev.map(rm => rm.id === r.id ? {...rm, name: e.target.value} : rm))} className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl outline-none text-xs font-black dark:text-white border dark:border-slate-700" placeholder="اسم الغرفة" />
                           <button onClick={() => {
                              const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
                              inp.onchange = (e) => {
                                 const f = (e.target as HTMLInputElement).files?.[0];
                                 if(f) { const rd = new FileReader(); rd.onload = () => setRooms(prev => prev.map(rm => rm.id === r.id ? {...rm, icon: rd.result as string} : rm)); rd.readAsDataURL(f); }
                              }; inp.click();
                           }} className="bg-violet-700 text-white p-3 rounded-xl shadow-lg flex items-center justify-center shrink-0 w-12 h-12">🖼️</button>
                        </div>
                        <div className="flex justify-between items-center px-1">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">تعديل الغرفة</span>
                           <button onClick={() => setRooms(prev => prev.filter(rm => rm.id !== r.id))} className="text-red-500 text-[10px] font-black hover:underline uppercase">حذف نهائي</button>
                        </div>
                     </div>
                   ))}
                   <button onClick={() => setRooms([...rooms, { id: Date.now().toString(), name: 'غرفة جديدة', description: 'وصف الغرفة', icon: '✨', createdBy: 'admin', onlineCount: 0 }])} className="w-full bg-violet-700/10 text-violet-700 py-4 rounded-2xl border-2 border-dashed border-violet-200 font-black text-xs">+ إضافة غرفة جديدة</button>
                </div>
             </div>
             
             <button onClick={() => { if(confirm('هل أنت متأكد من مسح جميع الرسائل؟')) setMessages({'main': []}); }} className="w-full bg-slate-900 text-white p-5 rounded-[32px] font-black text-sm text-center shadow-2xl active:scale-95 transition-all">🗑️ تصفير كافة المحادثات</button>
          </div>
        )}
      </main>

      {/* Message Options Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-[40px] p-8 shadow-2xl border dark:border-slate-800 animate-in zoom-in">
              <div className="flex items-center gap-4 mb-8 border-b dark:border-slate-800 pb-5">
                 <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-violet-100 dark:border-slate-700">
                    <img src={selectedMessage.senderAvatar} className="w-full h-full object-cover" />
                 </div>
                 <div>
                    <h5 className="font-black text-sm dark:text-white leading-tight">{selectedMessage.senderName}</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">إجراءات إدارية</p>
                 </div>
              </div>
              <div className="space-y-3">
                 <button onClick={() => handleAdminAction(selectedMessage, 'delete')} className="w-full bg-red-50 dark:bg-red-950/30 text-red-600 p-4 rounded-2xl text-[11px] font-black text-right flex justify-between items-center group active:scale-95 transition-all">حذف الرسالة <span className="text-lg opacity-50 group-hover:opacity-100">🗑️</span></button>
                 <button onClick={() => handleAdminAction(selectedMessage, 'mute')} className="w-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 p-4 rounded-2xl text-[11px] font-black text-right flex justify-between items-center group active:scale-95 transition-all">{mutedUsers.includes(selectedMessage.senderId) ? 'إلغاء الكتم' : 'كتم المستخدم'} <span className="text-lg opacity-50 group-hover:opacity-100">🔇</span></button>
                 <button onClick={() => handleAdminAction(selectedMessage, 'verify')} className="w-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 p-4 rounded-2xl text-[11px] font-black text-right flex justify-between items-center group active:scale-95 transition-all">{verifiedUsers.includes(selectedMessage.senderId) ? 'إلغاء التوثيق' : 'توثيق الحساب'} <span className="text-lg opacity-50 group-hover:opacity-100">✔️</span></button>
                 <button onClick={() => handleAdminAction(selectedMessage, 'ban')} className="w-full bg-red-600 text-white p-4 rounded-2xl text-[11px] font-black text-right flex justify-between items-center group active:scale-95 transition-all">حظر نهائي <span className="text-lg">🚫</span></button>
                 <button onClick={() => setSelectedMessage(null)} className="w-full mt-4 text-slate-400 font-black text-[10px] py-2 text-center uppercase tracking-widest hover:text-slate-600 transition-colors">إغلاق القائمة</button>
              </div>
           </div>
        </div>
      )}

      {/* Bottom Nav - Hidden in Chat */}
      {!isInsideChat && (
        <footer className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t dark:border-slate-800 flex justify-around items-center py-4 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button onClick={() => setActiveTab('rooms')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'rooms' ? 'text-violet-600 scale-110' : 'text-slate-400'}`}>
             <div className={`p-3 rounded-2xl transition-all ${activeTab === 'rooms' ? 'bg-violet-700 text-white shadow-xl shadow-violet-700/30' : 'bg-transparent'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
             </div>
             <span className="text-[9px] font-black uppercase tracking-tighter">الردهات</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'settings' ? 'text-violet-600 scale-110' : 'text-slate-400'}`}>
             <div className={`p-3 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-violet-700 text-white shadow-xl shadow-violet-700/30' : 'bg-transparent'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
             </div>
             <span className="text-[9px] font-black uppercase tracking-tighter">حسابي</span>
          </button>
        </footer>
      )}
    </div>
  );
};
