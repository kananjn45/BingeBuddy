import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-50">
      <h1 className="text-4xl font-bold">BingeBuddy</h1>
    </div>
  );
}

function RoomPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-50">
      <h1 className="text-4xl font-bold">Room</h1>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </Router>
  );
}

export default App;
