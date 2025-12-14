import React, { useState, useEffect } from 'react';
import { Upload, Download, User, Facebook, Youtube, Video, Move } from 'lucide-react';

const SabiFootballBuilder = () => {
  // --- STATE 1: The Background Image (Your Template) ---
  // Placeholder - replace with actual image path when available
  const [backgroundImg, setBackgroundImg] = useState('https://via.placeholder.com/1080x1920/1a1a1a/ffffff?text=Football+Template');
  
  // --- STATE 2: Header Data ---
  const [header, setHeader] = useState({
    title: "TEAM OF THE WEEK",
    subtitle: "Premier League | Matchday 12 | Oct 2023",
    logo: null
  });

  // --- STATE 3: Player of the Week (Spotlight) ---
  const [spotlight, setSpotlight] = useState({
    name: "HAALAND",
    stat: "3 GOALS - 9.5 RATING",
    image: null,
    clubLogo: null,
    // Adjust these to move the spotlight section around
    top: 18, 
    left: 50 
  });

  // --- STATE 4: The 11 Field Players ---
  // Default positions set for a standard 4-3-3. 
  // You can tweak 'x' (left %) and 'y' (top %) in the editor.
  const [players, setPlayers] = useState([
    { id: 1, pos: 'GK', name: 'ONANA', stat: '8.5', image: null, x: 50, y: 88 },
    { id: 2, pos: 'LB', name: 'SHAW', stat: '7.2', image: null, x: 15, y: 70 },
    { id: 3, pos: 'CB', name: 'VARANE', stat: '8.0', image: null, x: 38, y: 75 },
    { id: 4, pos: 'CB', name: 'DIAS', stat: '8.1', image: null, x: 62, y: 75 },
    { id: 5, pos: 'RB', name: 'WALKER', stat: '7.5', image: null, x: 85, y: 70 },
    { id: 6, pos: 'CM', name: 'RICE', stat: '8.8', image: null, x: 25, y: 55 },
    { id: 7, pos: 'CDM', name: 'RODRI', stat: '9.0', image: null, x: 50, y: 60 },
    { id: 8, pos: 'CM', name: 'PEDRI', stat: '8.4', image: null, x: 75, y: 55 },
    { id: 9, pos: 'LW', name: 'VINICIUS', stat: '8.9', image: null, x: 15, y: 35 },
    { id: 10, pos: 'ST', name: 'KANE', stat: '9.2', image: null, x: 50, y: 30 },
    { id: 11, pos: 'RW', name: 'SALAH', stat: '8.7', image: null, x: 85, y: 35 },
  ]);

  // --- Handlers ---
  const handleBgUpload = (e) => {
    if (e.target.files[0]) setBackgroundImg(URL.createObjectURL(e.target.files[0]));
  };

  const handleImageUpload = (e, targetId = null, type = 'player') => {
    if (e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      if (type === 'logo') setHeader({ ...header, logo: url });
      if (type === 'spotlight') setSpotlight({ ...spotlight, image: url });
      if (type === 'spotlightClub') setSpotlight({ ...spotlight, clubLogo: url });
      if (type === 'player') {
        setPlayers(players.map(p => p.id === targetId ? { ...p, image: url } : p));
      }
    }
  };

  const updatePlayer = (id, field, value) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  useEffect(() => {
    // Commented out - backend endpoint doesn't exist yet
    // Uncomment when backend is ready
    /*
    fetch('http://localhost:8000/backend/football/flyer.php')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setHeader(data.header);
          setSpotlight(data.spotlight);
          setPlayers(data.players);
          setBackgroundImg(data.backgroundImg);
        }
      })
      .catch(err => console.log('Backend not available yet'));
    */
  }, []);

  const handleSave = () => {
    const data = { header, spotlight, players, backgroundImg };
    // Commented out - backend endpoint doesn't exist yet
    console.log('Save data:', data);
    alert('Save functionality will be enabled when backend is ready');
    /*
    fetch('http://localhost:8000/backend/football/flyer.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(res => res.json())
      .then(savedData => console.log('Saved:', savedData))
      .catch(err => console.error('Save failed:', err));
    */
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 flex flex-col lg:flex-row gap-8 font-sans text-slate-100">
      
      {/* ================= CONTROLS SIDEBAR ================= */}
      <div className="w-full lg:w-1/3 bg-slate-800 p-4 rounded-xl h-[95vh] overflow-y-auto border border-slate-700 shadow-xl">
        <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
           FLYER SETTINGS
        </h2>

        {/* 1. Background Uploader */}
        <div className="mb-6 bg-slate-700 p-3 rounded-lg border border-slate-600">
          <h3 className="text-sm font-semibold mb-2 text-white">1. Upload Template Base</h3>
          <p className="text-xs text-slate-400 mb-2">Upload the image containing your pitch, header and footer graphics.</p>
          <input type="file" onChange={handleBgUpload} className="text-xs w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-yellow-500 file:text-slate-900 hover:file:bg-yellow-400"/>
        </div>

        {/* 2. Header Texts */}
        <div className="mb-6 border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold mb-2 text-white">2. Header Details</h3>
          <div className="space-y-2">
            <input type="text" value={header.title} onChange={e => setHeader({...header, title: e.target.value})} className="w-full bg-slate-900 p-2 rounded text-sm border border-slate-700" placeholder="Title" />
            <input type="text" value={header.subtitle} onChange={e => setHeader({...header, subtitle: e.target.value})} className="w-full bg-slate-900 p-2 rounded text-sm border border-slate-700" placeholder="Subtitle" />
            <div className="flex items-center gap-2">
              <span className="text-xs">Your Logo:</span>
              <input type="file" onChange={(e) => handleImageUpload(e, null, 'logo')} className="text-xs text-slate-400" />
            </div>
          </div>
        </div>

        {/* 3. Spotlight Player */}
        <div className="mb-6 border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold mb-2 text-yellow-400">3. Player of the Week</h3>
          <div className="space-y-2">
             <input type="text" value={spotlight.name} onChange={e => setSpotlight({...spotlight, name: e.target.value})} className="w-full bg-slate-900 p-2 rounded text-sm border border-slate-700" placeholder="Name" />
             <input type="text" value={spotlight.stat} onChange={e => setSpotlight({...spotlight, stat: e.target.value})} className="w-full bg-slate-900 p-2 rounded text-sm border border-slate-700" placeholder="Stat" />
             <div className="grid grid-cols-2 gap-2">
                <label className="bg-blue-600 hover:bg-blue-500 text-center py-2 rounded text-xs cursor-pointer">
                   Upload Photo
                   <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, null, 'spotlight')} />
                </label>
                <label className="bg-slate-600 hover:bg-slate-500 text-center py-2 rounded text-xs cursor-pointer">
                   Club Logo
                   <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, null, 'spotlightClub')} />
                </label>
             </div>
          </div>
        </div>

        {/* 4. Pitch Players */}
        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold mb-3 text-green-400">4. Pitch Layout ({players.length} Players)</h3>
          <div className="space-y-3">
            {players.map((p) => (
              <div key={p.id} className="bg-slate-700 p-2 rounded border border-slate-600 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold bg-slate-800 px-2 py-1 rounded w-8 text-center">{p.pos}</span>
                  <input type="text" value={p.name} onChange={(e) => updatePlayer(p.id, 'name', e.target.value)} className="bg-slate-900 p-1 rounded text-xs w-24 border border-slate-600" />
                  <input type="text" value={p.stat} onChange={(e) => updatePlayer(p.id, 'stat', e.target.value)} className="bg-slate-900 p-1 rounded text-xs w-10 text-center text-yellow-400 border border-slate-600" />
                  <label className="cursor-pointer text-blue-300 hover:text-white"><Upload size={14} /><input type="file" className="hidden" onChange={(e) => handleImageUpload(e, p.id, 'player')} /></label>
                </div>
                
                {/* Position Sliders */}
                <div className="flex gap-2 items-center text-[10px] text-slate-400">
                  <Move size={10} />
                  <span>Horiz:</span>
                  <input type="range" min="0" max="100" value={p.x} onChange={(e) => updatePlayer(p.id, 'x', Number(e.target.value))} className="w-16 h-1 bg-slate-500 rounded-lg appearance-none cursor-pointer" />
                  <span>Vert:</span>
                  <input type="range" min="0" max="100" value={p.y} onChange={(e) => updatePlayer(p.id, 'y', Number(e.target.value))} className="w-16 h-1 bg-slate-500 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-700 pt-4 mt-6">
          <button onClick={handleSave} className="w-full bg-yellow-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-400">
            Save Flyer State
          </button>
        </div>
      </div>

      {/* ================= PREVIEW CANVAS ================= */}
      <div className="flex-1 flex justify-center items-start">
        {/* The Container - Fixed Aspect Ratio (approx 4:5 for Socials) */}
        <div 
          className="relative bg-black shadow-2xl overflow-hidden" 
          style={{ width: '600px', height: '750px' }}
        >
            {/* 1. BACKGROUND IMAGE LAYER */}
            {backgroundImg ? (
                <img src={backgroundImg} alt="Template" className="w-full h-full object-cover" />
            ) : (
                // Fallback if no image uploaded yet
                <div className="w-full h-full bg-gradient-to-b from-blue-900 via-green-800 to-green-900 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                        <Upload size={48} className="mx-auto mb-2 opacity-50"/>
                        <p>Upload your Template Background Image</p>
                        <p className="text-xs opacity-50">(Controls Panel Section 1)</p>
                    </div>
                </div>
            )}

            {/* 2. OVERLAYS - HEADER */}
            <div className="absolute top-4 left-0 w-full text-center z-20">
                {header.logo && <img src={header.logo} alt="logo" className="h-12 mx-auto mb-2 object-contain drop-shadow-lg" />}
                <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter drop-shadow-md transform -skew-x-6">{header.title}</h1>
                <p className="text-white font-bold text-xs uppercase tracking-widest drop-shadow-md">{header.subtitle}</p>
            </div>

            {/* 3. OVERLAYS - SPOTLIGHT (Player of Week) */}
            <div 
                className="absolute w-[90%] z-20 flex items-center justify-center gap-4 transform -translate-x-1/2"
                style={{ top: `${spotlight.top}%`, left: `${spotlight.left}%` }}
            >
                {/* Spotlight Image */}
                <div className="relative">
                    {spotlight.image ? (
                        <img src={spotlight.image} className="h-32 object-contain drop-shadow-2xl" alt="Spotlight"/>
                    ) : (
                        <div className="h-32 w-32 bg-white/10 rounded-full border border-white/30 flex items-center justify-center"><User size={40} className="text-white/50"/></div>
                    )}
                </div>
                {/* Spotlight Text */}
                <div className="text-left">
                    <div className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded inline-block uppercase mb-1 shadow-lg">Player of the Week</div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-4xl font-black italic text-white uppercase leading-none drop-shadow-lg">{spotlight.name}</h2>
                        {spotlight.clubLogo && <img src={spotlight.clubLogo} className="h-8 w-8 object-contain drop-shadow-md"/>}
                    </div>
                    <div className="text-white text-sm font-bold mt-1 drop-shadow-md">{spotlight.stat}</div>
                </div>
            </div>

            {/* 4. OVERLAYS - PITCH PLAYERS */}
            {players.map((p) => (
                <div 
                    key={p.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-grab active:cursor-grabbing z-10"
                    style={{ top: `${p.y}%`, left: `${p.x}%` }}
                >
                    {/* The Player Card Design */}
                    <div className="relative mb-[-14px] z-10 transition-transform group-hover:scale-110">
                        {p.image ? (
                            <div className="w-20 h-20 rounded-full border-2 border-white bg-slate-800 overflow-hidden shadow-2xl">
                                <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-full border-2 border-white/40 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                                <User size={32} className="text-white/60" />
                            </div>
                        )}
                        {/* Rating Bubble */}
                        <div className="absolute bottom-0 right-0 bg-yellow-400 text-blue-900 text-xs font-black px-1.5 py-0.5 rounded border border-white shadow-sm">
                            {p.stat}
                        </div>
                    </div>

                    {/* The Name Plate */}
                    <div className="bg-blue-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-sm border-l-4 border-yellow-400 shadow-xl text-center min-w-[90px]">
                        <div className="text-[11px] uppercase font-black leading-none tracking-wide">{p.name}</div>
                        <div className="text-[9px] text-blue-300 font-bold uppercase mt-0.5">{p.pos}</div>
                    </div>
                </div>
            ))}

            {/* 5. OVERLAYS - FOOTER */}
            {/* We position this absolutely at the bottom to sit on top of the footer background */}
            <div className="absolute bottom-4 left-0 w-full flex justify-center items-center gap-6 z-30">
                 <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    <Facebook size={14} className="text-blue-500 fill-current" />
                    <span className="text-[10px] font-bold text-white tracking-wide">sabifootball</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    <Youtube size={14} className="text-red-600 fill-current" />
                    <span className="text-[10px] font-bold text-white tracking-wide">sabifootball</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                     {/* TikTok Icon Simulation */}
                    <div className="bg-black text-white p-[1px] rounded-full border border-white/50"><Video size={10} /></div>
                    <span className="text-[10px] font-bold text-white tracking-wide">sabifootball</span>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SabiFootballBuilder;
