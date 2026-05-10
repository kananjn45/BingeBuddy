import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Globe, Users, Link2, Monitor, ArrowRight, Flame } from 'lucide-react';

export default function LandingPage() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!username) return alert('Please enter a username first!');
    const newRoomId = Math.random().toString(36).substring(2, 9);
    navigate(`/room/${newRoomId}`, { state: { username } });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return alert('Please enter a username first!');
    if (!roomId) return alert('Please enter a Room ID!');
    navigate(`/room/${roomId}`, { state: { username } });
  };

  return (
    <div className="min-h-screen bg-[#F8F7F6] text-[#333333] font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#E57373] rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">WatchParty</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#A89F94]">
          <a href="#" className="hover:text-[#E57373] transition-colors">How it Works</a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="relative rounded-[2rem] overflow-hidden bg-[#2D2A26] h-[500px] flex flex-col items-center justify-center text-center px-4 shadow-2xl">
          {/* Hero Background Image Placeholder */}
          <div className="absolute inset-0 opacity-40 mix-blend-overlay">
             <img 
              src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=2000" 
              alt="Living Room" 
              className="w-full h-full object-cover"
             />
          </div>
          
          <div className="relative z-10 space-y-6 max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
              Watch YouTube Together
            </h1>
            <p className="text-[#A89F94] text-lg font-medium leading-relaxed">
              Sync videos and chat with your friends in real-time in a cozy, distraction-free environment.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button 
                onClick={handleCreateRoom}
                className="w-full sm:w-auto px-10 py-4 bg-[#E57373] hover:bg-[#D46262] text-white font-bold rounded-xl transition-all shadow-xl shadow-[#E57373]/20"
              >
                Create Room
              </button>
              <button 
                onClick={() => document.getElementById('join-input')?.focus()}
                className="w-full sm:w-auto px-10 py-4 bg-white hover:bg-slate-50 text-[#333333] font-bold rounded-xl transition-all"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>

        {/* Inputs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#A89F94] uppercase tracking-widest ml-1">Display Name</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your display name"
              autoComplete="off"
              className="w-full px-6 py-4 bg-white border border-[#A89F94]/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#E57373]/10 focus:border-[#E57373] transition-all text-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#A89F94] uppercase tracking-widest ml-1">Room ID (Optional)</label>
            <form onSubmit={handleJoinRoom} className="relative group">
              <input 
                id="join-input"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter Room ID to join"
                className="w-full px-6 py-4 bg-white border border-[#A89F94]/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#E57373]/10 focus:border-[#E57373] transition-all text-lg pr-16"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 w-12 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-all group-focus-within:bg-[#E57373] group-focus-within:text-white"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* How it Works Section */}
        <section className="mt-32">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-2">How it Works</h2>
            <p className="text-[#A89F94] font-medium">Got started in seconds. No sign up required. Just pure comfort.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-[#A89F94]/10 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group">
              <div className="w-12 h-12 bg-[#F8F7F6] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#E57373]/10 transition-colors">
                <Link2 className="w-6 h-6 text-[#A89F94] group-hover:text-[#E57373]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Paste Link</h3>
              <p className="text-[#A89F94] leading-relaxed text-sm font-medium">
                Paste any YouTube video link to instantly create a new, cozy viewing room.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-[#A89F94]/10 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group">
              <div className="w-12 h-12 bg-[#F8F7F6] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#E57373]/10 transition-colors">
                <Users className="w-6 h-6 text-[#A89F94] group-hover:text-[#E57373]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Invite Friends</h3>
              <p className="text-[#A89F94] leading-relaxed text-sm font-medium">
                Share the room link or simple ID with your friends to bring them into the space.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-[#A89F94]/10 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group">
              <div className="w-12 h-12 bg-[#F8F7F6] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#E57373]/10 transition-colors">
                <Monitor className="w-6 h-6 text-[#A89F94] group-hover:text-[#E57373]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Watch Together</h3>
              <p className="text-[#A89F94] leading-relaxed text-sm font-medium">
                Enjoy perfectly synced playback and relaxed chat together without interface fatigue.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-12 mt-20 border-t border-[#A89F94]/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[#A89F94] text-xs font-bold uppercase tracking-widest">
          © 2024 WatchParty. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-[#A89F94]">
          <Globe className="w-5 h-5 hover:text-[#E57373] cursor-pointer transition-colors" />
          <PlayCircle className="w-5 h-5 hover:text-[#E57373] cursor-pointer transition-colors" />
        </div>
      </footer>
    </div>
  );
}
