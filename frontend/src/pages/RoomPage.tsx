import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import YouTube, { type YouTubeEvent, type YouTubePlayer } from 'react-youtube';
import { 
  Users, 
  Settings, 
  Bell, 
  MessageSquare, 
  Share2, 
  LogOut, 
  Search,
  Crown,
  Shield,
  User as UserIcon,
  ChevronDown,
  Info,
  Clock,
  Eye,
  Plus,
  Send,
  PlayCircle,
  Check,
  Link2,
  Tv,
  X,
  Play,
  Loader2
} from 'lucide-react';
import { socket } from '../services/socket';

interface UserData {
  socketId: string;
  username: string;
  role: 'Host' | 'Moderator' | 'Participant';
}

interface SearchResult {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
}

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  role: string;
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState(location.state?.username || '');
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [myRole, setMyRole] = useState<'Host' | 'Moderator' | 'Participant'>('Participant');
  const [videoId, setVideoId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const playerRef = useRef<YouTubePlayer | null>(null);
  const isInternalChange = useRef(false);
  const targetState = useRef<{ currentTime: number; isPlaying: boolean } | null>(null);

  // Trending fallbacks
  const trendingVideos: SearchResult[] = [
    { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg', channel: 'Rick Astley' },
    { id: 'jfKfPfyJRdk', title: 'lofi hip hop radio - beats to relax/study to', thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg', channel: 'Lofi Girl' },
    { id: 'hT_nvWreIhg', title: 'OneRepublic - Counting Stars', thumbnail: 'https://img.youtube.com/vi/hT_nvWreIhg/mqdefault.jpg', channel: 'OneRepublic' },
    { id: '09R8_2nJtjg', title: 'Maroon 5 - Sugar', thumbnail: 'https://img.youtube.com/vi/09R8_2nJtjg/mqdefault.jpg', channel: 'Maroon 5' }
  ];

  useEffect(() => {
    if (!username) {
      const name = prompt('Please enter your name to join the room:');
      if (name) setUsername(name);
      else navigate('/');
    }
  }, [username, navigate]);

  useEffect(() => {
    if (!username || !roomId) return;

    if (!socket.connected) socket.connect();
    socket.emit('join_room', { roomId, username });

    socket.on('room_state', (state) => {
      setVideoId(state.videoId);
      setUsers(state.users);
      setMyRole(state.myRole);
      targetState.current = { currentTime: state.currentTime, isPlaying: state.isPlaying };
      if (playerRef.current) applyTargetState();
    });

    socket.on('user_joined', (updatedUsers) => {
      setUsers(updatedUsers);
      const me = updatedUsers.find((u: UserData) => u.socketId === socket.id);
      if (me) setMyRole(me.role);
    });

    socket.on('user_left', (updatedUsers) => {
      setUsers(updatedUsers);
      const me = updatedUsers.find((u: UserData) => u.socketId === socket.id);
      if (me) setMyRole(me.role);
    });
    
    socket.on('sync_state', ({ action, payload }) => {
      if (action === 'change_video') {
         setVideoId(payload.videoId);
         targetState.current = { currentTime: 0, isPlaying: true };
         return;
      }

      if (action === 'play') targetState.current = { currentTime: payload.currentTime, isPlaying: true };
      if (action === 'pause') targetState.current = { currentTime: payload.currentTime, isPlaying: false };
      if (action === 'seek') targetState.current = { ...targetState.current, currentTime: payload.currentTime, isPlaying: targetState.current?.isPlaying ?? true };

      if (playerRef.current) applyTargetState();
    });

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('error', (msg) => alert(msg));

    return () => {
      socket.emit('leave_room', { roomId });
      socket.off('room_state');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('sync_state');
      socket.off('new_message');
      socket.off('error');
    };
  }, [roomId, username]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const applyTargetState = () => {
    if (!playerRef.current || !targetState.current) return;
    isInternalChange.current = true;
    const { currentTime, isPlaying } = targetState.current;
    
    const currentPos = playerRef.current.getCurrentTime();
    if (Math.abs(currentPos - currentTime) > 2) {
      playerRef.current.seekTo(currentTime, true);
    }

    if (isPlaying) playerRef.current.playVideo();
    else playerRef.current.pauseVideo();

    setTimeout(() => { isInternalChange.current = false }, 1000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setIsLoadingResults(true);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSearchResults(data);
      } else {
        setSearchResults(trendingVideos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase())));
      }
    } catch (error) {
      console.error('Error fetching search results from backend:', error);
      setSearchResults(trendingVideos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase())));
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    socket.emit('send_message', { roomId, message: inputMessage });
    setInputMessage('');
  };

  const playVideo = (vId: string) => {
    if (!canControl) return alert('Only Hosts/Moderators can change the video.');
    setVideoId(vId);
    socket.emit('sync_action', { roomId, action: 'change_video', payload: { videoId: vId } });
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    applyTargetState();
  };

  const onStateChange = (event: YouTubeEvent) => {
    if (isInternalChange.current || !canControl) return;
    const state = event.data;
    const currentTime = event.target.getCurrentTime();
    if (state === YouTube.PlayerState.PLAYING) {
      socket.emit('sync_action', { roomId, action: 'play', payload: { currentTime } });
    } else if (state === YouTube.PlayerState.PAUSED) {
      socket.emit('sync_action', { roomId, action: 'pause', payload: { currentTime } });
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePromote = (targetSocketId: string) => {
    socket.emit('promote_user', { roomId, targetSocketId, newRole: 'Host' });
  };

  const canControl = myRole === 'Host' || myRole === 'Moderator';

  return (
    <div className="min-h-screen bg-[#F8F7F6] text-[#333333] font-sans flex flex-col selection:bg-[#E57373]/20">
      {/* Top Navbar */}
      <nav className="h-16 bg-white border-b border-[#A89F94]/10 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="font-bold text-xl tracking-tight text-[#E57373]">WatchRoom</span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-12 relative group hidden md:block">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A89F94]" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search YouTube videos..." 
            className="w-full pl-11 pr-4 py-2.5 bg-[#F8F7F6] rounded-2xl text-sm border-none focus:ring-4 focus:ring-[#E57373]/10 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button type="button" onClick={() => {setSearchQuery(''); setIsSearching(false); setSearchResults([]);}} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A89F94] hover:text-[#E57373]">
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 pr-6 border-r border-[#A89F94]/10">
            <Bell className="w-5 h-5 text-[#A89F94] cursor-pointer" />
            <Settings className="w-5 h-5 text-[#A89F94] cursor-pointer" />
          </div>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-[#A89F94]/20">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt="avatar" />
             </div>
             <ChevronDown className="w-4 h-4 text-[#A89F94]" />
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Search Results Overlay */}
        {(isSearching) && (
          <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-sm p-8 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex items-center justify-between border-b border-[#A89F94]/10 pb-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Search Results</h2>
                  <p className="text-sm text-[#A89F94] mt-1">Showing results for "{searchQuery || 'trending'}"</p>
                </div>
                <button onClick={() => {setIsSearching(false); setSearchQuery(''); setSearchResults([]);}} className="p-3 hover:bg-[#F8F7F6] rounded-2xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {isLoadingResults ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <Loader2 className="w-12 h-12 text-[#E57373] animate-spin" />
                  <p className="text-[#A89F94] font-medium animate-pulse">Searching YouTube...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                  {(searchResults.length > 0 ? searchResults : trendingVideos).map(video => (
                    <div key={video.id} className="group cursor-pointer space-y-4" onClick={() => playVideo(video.id)}>
                      <div className="relative aspect-video rounded-3xl overflow-hidden shadow-sm group-hover:shadow-2xl transition-all group-hover:translate-y-[-4px]">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <div className="w-14 h-14 bg-[#E57373] rounded-full flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform shadow-xl">
                              <Play className="w-7 h-7 fill-white ml-1" />
                           </div>
                        </div>
                      </div>
                      <div className="px-1">
                        <h3 className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-[#E57373] transition-colors" dangerouslySetInnerHTML={{ __html: video.title }} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#A89F94] mt-2">{video.channel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="space-y-6">
            <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-video shadow-2xl ring-1 ring-black/5">
              {!canControl && videoId && <div className="absolute inset-0 z-10 cursor-not-allowed" />}
              {videoId ? (
                <YouTube
                  videoId={videoId}
                  onReady={onReady}
                  onStateChange={onStateChange}
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: { autoplay: 1, controls: canControl ? 1 : 0, modestbranding: 1, rel: 0 },
                  }}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#A89F94] space-y-4 bg-[#2D2A26]">
                  <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center animate-float">
                    <PlayCircle className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="font-bold tracking-widest uppercase text-[10px]">Use the search bar to find a video</p>
                </div>
              )}
            </div>

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Watching Room</h2>
                <div className="flex items-center gap-3 text-xs font-bold text-[#A89F94] uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Tv className="w-3 h-3" /> Room ID: {roomId}</span>
                  <div className="w-1 h-1 bg-[#A89F94]/30 rounded-full" />
                  <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {users.length} Watching</span>
                </div>
              </div>
              <button 
                onClick={() => setIsSearching(true)}
                className="px-6 py-3 bg-[#E57373] hover:bg-[#D46262] text-white rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-[#E57373]/20 transition-all"
              >
                <Search className="w-4 h-4" /> Browse Videos
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-[#A89F94]/10 shadow-sm space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A89F94]">Live Status</p>
              <div className="text-3xl font-bold tracking-tight">Active</div>
              <p className="text-[10px] font-bold text-[#24A978] uppercase">Syncing Perfectly</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-[#A89F94]/10 shadow-sm space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A89F94]">Participants</p>
              <div className="text-3xl font-bold tracking-tight">{users.length}</div>
              <p className="text-[10px] font-bold text-[#A89F94] uppercase">In this room</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-[#A89F94]/10 shadow-sm space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A89F94]">Your Access</p>
              <div className="text-3xl font-bold tracking-tight">{myRole}</div>
              <p className="text-[10px] font-bold text-[#A89F94] uppercase">Live Permissions</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-96 bg-white border-l border-[#A89F94]/10 flex flex-col">
          <div className="p-6 border-b border-[#A89F94]/10">
             <h3 className="font-bold text-lg text-[#E57373]">Room Dashboard</h3>
             <p className="text-xs text-[#A89F94] font-medium flex items-center gap-2">
               {username} <div className="w-1.5 h-1.5 rounded-full bg-[#24A978]" />
             </p>
          </div>

          <div className="flex p-2 gap-2 bg-[#F8F7F6]/50 mx-6 mt-6 rounded-xl border border-[#A89F94]/5">
            <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'chat' ? 'bg-white text-[#E57373] shadow-sm' : 'text-[#A89F94] hover:text-[#333]'}`}>Live Chat</button>
            <button onClick={() => setActiveTab('participants')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'participants' ? 'bg-white text-[#E57373] shadow-sm' : 'text-[#A89F94] hover:text-[#333]'}`}>Participants</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            {activeTab === 'participants' ? (
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.socketId} className="flex items-center gap-3 p-3 hover:bg-[#F8F7F6] rounded-2xl transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#A89F94]/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      {user.role === 'Host' ? <Crown className="w-5 h-5 text-[#E57373]" /> : <UserIcon className="w-5 h-5 text-[#A89F94]" />}
                    </div>
                    <div>
                      <span className="block text-sm font-bold">{user.username} {user.socketId === socket.id && '(You)'}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#A89F94]">{user.role}</span>
                    </div>
                    {myRole === 'Host' && user.socketId !== socket.id && user.role !== 'Host' && (
                      <button 
                        onClick={() => handlePromote(user.socketId)}
                        className="ml-auto p-2 text-[#E57373] hover:bg-[#E57373]/10 rounded-lg transition-colors group/btn"
                        title="Promote to Host"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#A89F94]">
                      <MessageSquare className="w-12 h-12 opacity-10 mb-4" />
                      <p className="text-sm font-medium italic">No messages yet. Say hi to the room!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[10px] font-bold text-[#A89F94]">{msg.username}</span>
                          <span className="text-[9px] text-[#A89F94]/60">{msg.timestamp}</span>
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] shadow-sm ${
                          msg.username === username 
                            ? 'bg-[#E57373] text-white rounded-tr-none' 
                            : 'bg-[#F8F7F6] text-[#333] rounded-tl-none border border-[#A89F94]/10'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-[#A89F94]/10 relative">
                  <input 
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full pl-4 pr-12 py-3 bg-[#F8F7F6] rounded-xl text-sm border-none focus:ring-2 focus:ring-[#E57373]/20 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#E57373] disabled:text-[#A89F94]/30 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-[#A89F94]/10 bg-white">
            <button onClick={copyRoomLink} className="w-full py-4 bg-[#E57373] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#D46262] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#E57373]/20 active:scale-95">
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Link Copied!' : 'Invite Friends'}
            </button>
            <button onClick={() => navigate('/')} className="mt-3 w-full py-4 bg-[#F8F7F6] text-[#333] text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all border border-[#A89F94]/10 flex items-center justify-center gap-2 active:scale-95">
              <LogOut className="w-4 h-4" /> Leave Room
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
