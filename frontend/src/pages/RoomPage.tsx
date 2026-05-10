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
  Tv
} from 'lucide-react';
import { socket } from '../services/socket';

interface UserData {
  socketId: string;
  username: string;
  role: 'Host' | 'Moderator' | 'Participant';
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState(location.state?.username || '');
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [myRole, setMyRole] = useState<'Host' | 'Moderator' | 'Participant'>('Participant');
  const [videoId, setVideoId] = useState('');
  const [inputVideoId, setInputVideoId] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  
  const playerRef = useRef<YouTubePlayer | null>(null);
  const isInternalChange = useRef(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Buffering state for the player
  const targetState = useRef<{ currentTime: number; isPlaying: boolean } | null>(null);

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
      console.log('Initial Room state:', state);
      setVideoId(state.videoId);
      setUsers(state.users);
      setMyRole(state.myRole);
      
      // Queue up initial sync
      targetState.current = { currentTime: state.currentTime, isPlaying: state.isPlaying };
      if (playerRef.current) applyTargetState();
    });

    socket.on('user_joined', (updatedUsers) => setUsers(updatedUsers));
    socket.on('user_left', (updatedUsers) => setUsers(updatedUsers));
    
    socket.on('sync_state', ({ action, payload }) => {
      console.log('Sync action received:', action, payload);
      
      if (action === 'change_video') {
         setVideoId(payload.videoId);
         targetState.current = { currentTime: 0, isPlaying: true };
         return; // Wait for onReady
      }

      // Update target state
      if (action === 'play') targetState.current = { currentTime: payload.currentTime, isPlaying: true };
      if (action === 'pause') targetState.current = { currentTime: payload.currentTime, isPlaying: false };
      if (action === 'seek') targetState.current = { ...targetState.current, currentTime: payload.currentTime, isPlaying: targetState.current?.isPlaying ?? true };

      if (playerRef.current) {
        applyTargetState();
      }
    });

    socket.on('error', (msg) => alert(msg));

    return () => {
      socket.emit('leave_room', { roomId });
      socket.off('room_state');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('sync_state');
      socket.off('error');
    };
  }, [roomId, username]);

  const applyTargetState = () => {
    if (!playerRef.current || !targetState.current) return;
    
    isInternalChange.current = true;
    const { currentTime, isPlaying } = targetState.current;
    
    console.log('Applying target state:', targetState.current);
    
    // Seek if difference is significant (> 2 seconds)
    const currentPos = playerRef.current.getCurrentTime();
    if (Math.abs(currentPos - currentTime) > 2) {
      playerRef.current.seekTo(currentTime, true);
    }

    if (isPlaying) playerRef.current.playVideo();
    else playerRef.current.pauseVideo();

    setTimeout(() => { isInternalChange.current = false }, 1000);
  };

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const handleChangeVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (myRole === 'Participant') return alert('Only Hosts/Moderators can change the video.');
    const newId = extractVideoId(inputVideoId);
    if (!newId) return;
    setVideoId(newId);
    socket.emit('sync_action', { roomId, action: 'change_video', payload: { videoId: newId } });
    setInputVideoId('');
  };

  const onReady = (event: YouTubeEvent) => {
    console.log('Player Ready');
    playerRef.current = event.target;
    applyTargetState();
  };

  const onStateChange = (event: YouTubeEvent) => {
    if (isInternalChange.current || (myRole !== 'Host' && myRole !== 'Moderator')) return;
    
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

  const canControl = myRole === 'Host' || myRole === 'Moderator';

  return (
    <div className="min-h-screen bg-[#F8F7F6] text-[#333333] font-sans flex flex-col selection:bg-[#E57373]/20">
      {/* Top Navbar */}
      <nav className="h-16 bg-white border-b border-[#A89F94]/10 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="font-bold text-xl tracking-tight text-[#E57373]">WatchRoom</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-[#A89F94]">
            <a href="#" className="text-[#E57373] relative after:absolute after:bottom-[-22px] after:left-0 after:right-0 after:h-0.5 after:bg-[#E57373]">Rooms</a>
            <a href="#" className="hover:text-[#333333] transition-colors">Discover</a>
            <a href="#" className="hover:text-[#333333] transition-colors">Friends</a>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-4 relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 text-[#A89F94]" />
          <input 
            type="text" 
            placeholder="Search rooms..." 
            className="w-full pl-10 pr-4 py-2 bg-[#F8F7F6] rounded-xl text-sm border-none focus:ring-2 focus:ring-[#E57373]/20"
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 pr-6 border-r border-[#A89F94]/10">
            <Bell className="w-5 h-5 text-[#A89F94] cursor-pointer hover:text-[#333333]" />
            <Settings className="w-5 h-5 text-[#A89F94] cursor-pointer hover:text-[#333333]" />
          </div>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-[#A89F94]/20">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} alt="avatar" />
             </div>
             <ChevronDown className="w-4 h-4 text-[#A89F94]" />
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Video & Dashboard */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="space-y-6">
            <div className="relative rounded-[2rem] overflow-hidden bg-black aspect-video shadow-2xl ring-1 ring-black/5">
              {!canControl && videoId && <div className="absolute inset-0 z-10 cursor-not-allowed" title="Only host can control" />}
              {videoId ? (
                <YouTube
                  videoId={videoId}
                  onReady={onReady}
                  onStateChange={onStateChange}
                  opts={{
                    width: '100%',
                    height: '100%',
                    playerVars: { 
                      autoplay: 1, 
                      controls: canControl ? 1 : 0, 
                      modestbranding: 1, 
                      rel: 0 
                    },
                  }}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#A89F94] space-y-4 bg-[#2D2A26]">
                  <PlayCircle className="w-16 h-16 opacity-20" />
                  <p className="font-bold tracking-widest uppercase text-xs">Waiting for Host</p>
                </div>
              )}
            </div>

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Currently Binging</h2>
                <div className="flex items-center gap-3 text-xs font-bold text-[#A89F94] uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Tv className="w-3 h-3" /> Room ID: {roomId}</span>
                  <div className="w-1 h-1 bg-[#A89F94]/30 rounded-full" />
                  <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {users.length} Watching</span>
                </div>
              </div>
              {canControl && (
                <button 
                  onClick={() => videoInputRef.current?.focus()}
                  className="px-6 py-3 bg-[#E57373] hover:bg-[#D46262] text-white rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-[#E57373]/20 transition-all"
                >
                  <Plus className="w-4 h-4" /> Change Video
                </button>
              )}
            </div>

            {canControl && (
              <form onSubmit={handleChangeVideo} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-[#A89F94]/10 shadow-sm">
                <div className="flex-1 relative">
                  <Link2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#A89F94]" />
                  <input 
                    ref={videoInputRef}
                    type="text" 
                    value={inputVideoId}
                    onChange={(e) => setInputVideoId(e.target.value)}
                    placeholder="Paste YouTube Link (e.g. https://youtu.be/...)" 
                    className="w-full pl-10 pr-4 py-3 bg-[#F8F7F6] rounded-xl text-sm border-none focus:ring-2 focus:ring-[#E57373]/20"
                  />
                </div>
                <button type="submit" className="px-8 py-3 bg-[#333] text-white text-sm font-bold rounded-xl hover:bg-black transition-all">
                  Load
                </button>
              </form>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-[#A89F94]/10 shadow-sm space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A89F94]">Session Status</p>
              <div className="text-3xl font-bold">Active</div>
              <p className="text-[10px] font-bold text-[#A89F94] uppercase">Live Syncing Enabled</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-[#A89F94]/10 shadow-sm space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A89F94]">Participants</p>
              <div className="text-3xl font-bold">{users.length}</div>
              <p className="text-[10px] font-bold text-[#24A978] uppercase">Friends Online</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-[#A89F94]/10 shadow-sm space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A89F94]">Your Role</p>
              <div className="text-3xl font-bold">{myRole}</div>
              <p className="text-[10px] font-bold text-[#A89F94] uppercase">Permissions Active</p>
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
            <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${activeTab === 'chat' ? 'bg-white text-[#E57373] shadow-sm' : 'text-[#A89F94]'}`}>Live Chat</button>
            <button onClick={() => setActiveTab('participants')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${activeTab === 'participants' ? 'bg-white text-[#E57373] shadow-sm' : 'text-[#A89F94]'}`}>Participants</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'participants' ? (
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.socketId} className="flex items-center gap-3 p-2 hover:bg-[#F8F7F6] rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#A89F94]/10 flex items-center justify-center">
                      {user.role === 'Host' ? <Crown className="w-5 h-5 text-[#E57373]" /> : <UserIcon className="w-5 h-5 text-[#A89F94]" />}
                    </div>
                    <div>
                      <span className="block text-sm font-bold">{user.username} {user.socketId === socket.id && '(You)'}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#A89F94]">{user.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#A89F94]">
                <MessageSquare className="w-12 h-12 opacity-10 mb-4" />
                <p className="text-sm font-medium italic">Chat will be enabled in Phase 2. Syncing is currently prioritized!</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-[#A89F94]/10 bg-white">
            <button onClick={copyRoomLink} className="w-full py-3.5 bg-[#E57373] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#D46262] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#E57373]/20">
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Copied Link!' : 'Invite Friends'}
            </button>
            <button onClick={() => navigate('/')} className="mt-3 w-full py-3.5 bg-[#F8F7F6] text-[#333] text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all border border-[#A89F94]/10 flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> Leave Room
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
