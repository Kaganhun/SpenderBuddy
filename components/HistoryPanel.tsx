import React from 'react';
import type { ResearchResult } from '../services/geminiService';
import type { FilterCategory } from '../types';

export interface HistoryItem extends ResearchResult {
    query: string;
    query2?: string;
    timestamp: number;
    filters?: FilterCategory[];
}

interface HistoryPanelProps {
    history: HistoryItem[];
    onSelect: (item: HistoryItem) => void;
    onClear: () => void;
}

const HistoryIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TrashIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onClear }) => {
    return (
        <div className="mt-12 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-200 flex items-center gap-3">
                    <HistoryIcon />
                    Search History
                </h2>
                <button 
                    onClick={onClear} 
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors duration-200 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700/50 border border-slate-700">
                    <TrashIcon />
                    Clear
                </button>
            </div>
            <div className="space-y-3">
                {history.map((item) => {
                    const displayQuery = item.query2 ? `${item.query} vs ${item.query2}` : item.query;
                    return (
                        <div
                            key={item.timestamp}
                            onClick={() => onSelect(item)}
                            className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg cursor-pointer hover:bg-slate-700/50 hover:border-blue-500/50 transition-all duration-200"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(item)}
                            title={displayQuery}
                        >
                            <p className="font-medium text-slate-200 truncate">{displayQuery}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
