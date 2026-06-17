import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Circle, SquareSquare, RefreshCw } from 'lucide-react';
import type { CronLog } from '../../types/schedule.types';

// Mock variables removed

import { scheduleService } from '../../services/scheduleService';

export const TerminalCronMonitor: React.FC = () => {
  const [logs, setLogs] = useState<CronLog[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever logs change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Poll real-time logs from backend
  useEffect(() => {
    if (!isRunning) return;

    const fetchLogs = async () => {
      try {
        const fetchedLogs = await scheduleService.getCronLogs();
        setLogs(fetchedLogs.map((log: any) => ({
          id: log._id,
          timestamp: log.timestamp,
          message: log.message,
          status: log.status
        })));
      } catch (err) {
        console.error("Failed to fetch cron logs", err);
      }
    };

    // Fetch immediately
    fetchLogs();

    // Poll every 5 seconds
    const intervalId = setInterval(fetchLogs, 5000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  const getStatusColor = (status: CronLog['status']) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getStatusIcon = (status: CronLog['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour12: false });
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto rounded-lg overflow-hidden border border-slate-700 shadow-2xl bg-slate-900 font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Terminal size={18} className="text-slate-400" />
          <span className="text-slate-300 font-semibold text-xs tracking-wider uppercase">Cron Monitoring Panel</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors ${isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
          >
            {isRunning ? <SquareSquare size={14} /> : <RefreshCw size={14} />}
            <span>{isRunning ? 'Stop Polling' : 'Start Polling'}</span>
          </button>
          {/* Fake Window Controls */}
          <div className="flex space-x-1.5">
            <Circle size={12} className="text-red-500 fill-red-500" />
            <Circle size={12} className="text-yellow-500 fill-yellow-500" />
            <Circle size={12} className="text-green-500 fill-green-500" />
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div ref={scrollContainerRef} className="p-4 h-80 overflow-y-auto bg-slate-950 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="flex flex-col space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex hover:bg-slate-800/50 px-2 py-0.5 rounded transition-colors break-words">
              <span className="text-slate-500 shrink-0 w-24">[{formatTime(log.timestamp)}]</span>
              <span className="mr-2 shrink-0">{getStatusIcon(log.status)}</span>
              <span className={`${getStatusColor(log.status)} flex-1`}>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
