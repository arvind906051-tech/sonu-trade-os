import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  RefreshCw,
  ShieldAlert,
  Zap,
  User,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { isSoundMuted, setSoundMuted } from '../utils/audio';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSimulatingTicks: boolean;
  setIsSimulatingTicks: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenOrderModal: () => void;
  isKillSwitchActive: boolean;
  isLockedOut: boolean;
  isBackendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isSimulatingTicks,
  setIsSimulatingTicks,
  onOpenOrderModal,
  isKillSwitchActive,
  isLockedOut,
  isBackendConnected = false
}) => {
  const { user, profile, setIsAuthModalOpen, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [muted, setMuted] = useState(isSoundMuted());
  const [currentTime, setCurrentTime] = useState({
    ist: '',
    utc: ''
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // IST is UTC+5:30
      const istString = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const utcString = now.toLocaleTimeString('en-US', {
        timeZone: 'UTC',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentTime({ ist: istString, utc: utcString });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleMute = () => {
    const next = !muted;
    setSoundMuted(next);
    setMuted(next);
  };

  const navItems = [
    { id: 'command-center', label: 'Command Center' },
    { id: 'option-chains', label: 'Option Chains' },
    { id: 'signal-pipeline', label: 'Signal Pipeline' },
    { id: 'liquidity-board', label: 'Liquidity Board' },
    { id: 'risk-engine', label: 'Risk Engine' },
    { id: 'digicools-store', label: 'DigiCools Store' }
  ];

  return (
    <header className="border-b border-[#1f293d] bg-[#0c1017]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
      {/* Universal Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav Links) — Zone 3 (Action) */}
      <div className="flex items-center justify-between gap-8 max-w-[1720px] mx-auto">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500/20 to-emerald-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-xs tracking-wider shadow-inner">
            SG
          </div>
          <a
            href="#command-center"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('command-center');
            }}
            className="text-base lg:text-lg font-bold tracking-tight text-white whitespace-nowrap hover:text-amber-400 transition-colors"
          >
            sonu (Ghochu) Trade OS
          </a>
          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 border border-slate-800 bg-slate-900/60 px-2 py-0.5 rounded">
            INDEX DESK
          </span>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4 text-xs lg:text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  isActive
                    ? 'text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Clock, Controls & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live Clocks */}
          <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded">
            <span className="text-emerald-400 font-medium">IST {currentTime.ist || '09:15:00'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">UTC {currentTime.utc || '03:45'}</span>
          </div>

          {/* Backend Feed Status Indicator */}
          <div
            title={
              isBackendConnected
                ? 'Connected to local FastAPI backend (ws://localhost:8000/ws/stream)'
                : 'FastAPI backend not detected. Running internal tick simulator. Start backend/main.py to connect.'
            }
            className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono border ${
              isBackendConnected
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="hidden xl:inline">{isBackendConnected ? 'SMARTAPI WS' : 'DESK ENGINE'}</span>
          </div>

          {/* Tick Simulation Toggle */}
          <button
            onClick={() => setIsSimulatingTicks((prev) => !prev)}
            title={isSimulatingTicks ? 'Pause live market ticks' : 'Resume live market ticks'}
            className={`p-1.5 rounded border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
              isSimulatingTicks
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingTicks ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span className="hidden lg:inline">{isSimulatingTicks ? 'TICKS LIVE' : 'PAUSED'}</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={handleToggleMute}
            title={muted ? 'Unmute desk alerts' : 'Mute desk alerts'}
            className="p-1.5 rounded border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
          </button>

          {/* User Account / Supabase Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-800 bg-[#0b0e15] hover:border-slate-700 transition-colors cursor-pointer text-xs font-mono"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-bold text-[10px]">
                  {profile?.fullName?.charAt(0) || 'T'}
                </div>
                <div className="hidden xl:flex flex-col text-left leading-none">
                  <span className="text-[11px] font-bold text-slate-200 truncate max-w-[85px]">
                    {profile?.fullName?.split(' ')[0] || 'Trader'}
                  </span>
                  <span className="text-[9px] text-amber-400 font-semibold">
                    {profile?.subscriptionTier === 'PRO_TRADER'
                      ? 'PRO'
                      : profile?.subscriptionTier === 'INSTITUTIONAL'
                      ? 'INST'
                      : 'FREE'}
                  </span>
                </div>
              </button>

              {/* User dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#0f1420] border border-[#232c40] rounded-lg shadow-2xl p-2.5 z-50 text-xs font-mono animate-fade-in">
                  <div className="pb-2 mb-2 border-b border-slate-800">
                    <div className="font-bold text-white truncate">{profile?.fullName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{profile?.email}</div>
                    <div className="mt-1 flex items-center gap-1 text-[9px] text-amber-300">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>
                        Tier: {profile?.subscriptionTier?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('digicools-store');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white text-left cursor-pointer transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                      <span>DigiCools Library</span>
                    </button>

                    <a
                      href="https://tradetrack-journal-omega.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white text-left cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>TradeTrack Journal</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>

                    <button
                      onClick={() => {
                        signOut();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-rose-950/40 text-rose-300 text-left cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-2.5 py-1.5 rounded text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In</span>
            </button>
          )}

          {/* TradeTrack Journal Button */}
          <a
            href="https://tradetrack-journal-omega.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold bg-[#111726] hover:bg-[#182136] text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/60 transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0 group"
            title="Open TradeTrack Journal in a new tab"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:scale-105 transition-transform" />
            <span>TradeTrack Journal</span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-300 transition-colors" />
          </a>

          {/* Primary Action Button */}
          <button
            onClick={onOpenOrderModal}
            disabled={isKillSwitchActive || isLockedOut}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isKillSwitchActive || isLockedOut
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {isKillSwitchActive || isLockedOut ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>CIRCUIT LOCKED</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>STAGE ORDER</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex md:hidden items-center gap-1 overflow-x-auto pt-2.5 mt-2 border-t border-slate-800/80 no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              activeTab === item.id
                ? 'text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
        <a
          href="https://tradetrack-journal-omega.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap px-2.5 py-1 rounded text-xs transition-colors cursor-pointer text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1 shrink-0 font-medium"
        >
          <BookOpen className="w-3 h-3 text-amber-400" />
          <span>Journal</span>
          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
        </a>
      </div>
    </header>
  );
};
