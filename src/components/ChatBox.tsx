import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User as UserIcon, Search, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, where, or, and } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { User, ChatMessage } from '../types';

interface ChatBoxProps {
  user: User;
}

type Tab = 'global' | 'private';

export default function ChatBox({ user }: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('global');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all users for private chat selection
  useEffect(() => {
    if (!isOpen || activeTab !== 'private' || selectedRecipient) return;

    const q = query(collection(db, 'users'), where('id', '!=', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => users.push({ ...doc.data(), id: doc.id } as User));
      setAllUsers(users);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    return () => unsubscribe();
  }, [isOpen, activeTab, selectedRecipient, user.id]);

  // Fetch messages based on active chat
  useEffect(() => {
    if (!isOpen) return;

    let q;
    if (activeTab === 'global') {
      q = query(
        collection(db, 'messages'),
        where('recipientId', '==', null),
        orderBy('timestamp', 'asc'),
        limit(100)
      );
    } else if (selectedRecipient) {
      q = query(
        collection(db, 'messages'),
        or(
          and(where('senderId', '==', user.id), where('recipientId', '==', selectedRecipient.id)),
          and(where('senderId', '==', selectedRecipient.id), where('recipientId', '==', user.id))
        ),
        orderBy('timestamp', 'asc'),
        limit(100)
      );
    } else {
      setMessages([]);
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          text: data.text,
          recipientId: data.recipientId,
          timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
        });
      });
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'messages'));

    return () => unsubscribe();
  }, [isOpen, activeTab, selectedRecipient, user.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        text,
        timestamp: serverTimestamp(),
        recipientId: activeTab === 'private' ? selectedRecipient?.id : null
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: { [date: string]: ChatMessage[] } = {};
    msgs.forEach((msg) => {
      const date = formatDate(msg.timestamp);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print">
      {!isOpen && (
        <motion.button
          drag
          dragConstraints={{ left: -window.innerWidth + 100, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
          whileDrag={{ scale: 1.1 }}
          onClick={() => setIsOpen(true)}
          className="bg-pink-600 text-white p-4 rounded-full shadow-lg hover:bg-pink-700 transition-colors flex items-center justify-center cursor-move"
        >
          <MessageSquare className="w-6 h-6" />
        </motion.button>
      )}

      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 h-[600px] flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-pink-600 text-white p-4 shadow-md">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                {activeTab === 'private' && selectedRecipient && (
                  <button onClick={() => setSelectedRecipient(null)} className="p-1 hover:bg-pink-500 rounded-full">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h3 className="font-bold flex items-center gap-2">
                    {activeTab === 'global' ? 'Global Chat' : selectedRecipient ? selectedRecipient.name : 'Select Contact'}
                  </h3>
                  <p className="text-pink-100 text-[10px]">
                    {activeTab === 'global' ? 'All Students & Employees' : selectedRecipient ? selectedRecipient.role : 'One-on-one message'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-pink-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-pink-700/50 rounded-lg p-1">
              <button
                onClick={() => { setActiveTab('global'); setSelectedRecipient(null); }}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors ${activeTab === 'global' ? 'bg-white text-pink-600' : 'text-white hover:bg-pink-600/50'}`}
              >
                Global
              </button>
                <button
                onClick={() => setActiveTab('private')}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors ${activeTab === 'private' ? 'bg-white text-pink-600' : 'text-white hover:bg-pink-600/50'}`}
              >
                One on One
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
            {activeTab === 'private' && !selectedRecipient ? (
              /* User List / Search */
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-10">No users found.</div>
                  ) : (
                    filteredUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedRecipient(u)}
                        className="w-full flex items-center gap-3 p-3 bg-white hover:bg-pink-50 rounded-xl border border-gray-100 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold group-hover:bg-pink-200">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-sm text-gray-900 truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase">{u.role}</p>
                        </div>
                        <MessageSquare className="w-4 h-4 text-gray-300 group-hover:text-pink-500" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Messages */
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                {Object.keys(messageGroups).length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white m-4 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 mb-2">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No messages yet</p>
                    <p className="text-gray-400 text-xs mt-1">Start the conversation by typing below</p>
                  </div>
                ) : (
                  Object.entries(messageGroups).map(([date, msgs]) => (
                    <div key={date} className="space-y-4">
                      <div className="flex justify-center">
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {date === formatDate(new Date().toISOString()) ? 'Today' : date}
                        </span>
                      </div>
                      {msgs.map((msg) => {
                        const isMe = msg.senderId === user.id;
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {activeTab === 'global' && !isMe && (
                              <div className="flex items-baseline gap-2 mb-1 px-1">
                                <span className="text-[10px] font-bold text-gray-700">
                                  {msg.senderName}
                                </span>
                                <span className="text-[9px] text-gray-400 uppercase">
                                  {msg.senderRole}
                                </span>
                              </div>
                            )}
                            <div className="group relative max-w-[85%]">
                              <div
                                className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                                  isMe
                                    ? 'bg-pink-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                }`}
                              >
                                {msg.text}
                              </div>
                              <div className={`mt-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[9px] text-gray-400 font-medium bg-white/80 px-1 rounded">
                                  {formatDateTime(msg.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input - Only show if not selecting a user */}
          {(activeTab === 'global' || selectedRecipient) && (
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={activeTab === 'global' ? "Reply to global..." : `Message ${selectedRecipient?.name}...`}
                className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 bg-gray-50"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-pink-600 text-white p-2.5 rounded-2xl hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-200 items-center justify-center flex"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
