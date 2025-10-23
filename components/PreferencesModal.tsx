import React, { useState, useEffect } from 'react';
import type { Preferences } from '../types';

interface PreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (prefs: Preferences) => void;
    currentPreferences: Preferences;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose, onSave, currentPreferences }) => {
    const [prefs, setPrefs] = useState<Preferences>(currentPreferences);

    useEffect(() => {
        setPrefs(currentPreferences);
    }, [currentPreferences, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const handleSave = () => {
        onSave(prefs);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPrefs(prev => ({
            ...prev,
            [name]: name === 'historyCount' ? parseInt(value, 10) : value,
        }));
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="preferences-title"
        >
            <div 
                className="bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-slate-700"
                onClick={e => e.stopPropagation()}
            >
                <h2 id="preferences-title" className="text-2xl font-bold text-slate-100 mb-6">Settings</h2>
                
                <div className="space-y-6">
                    <div>
                        <label htmlFor="historyCount" className="block text-sm font-medium text-slate-300 mb-2">
                            History items to keep
                        </label>
                        <select
                            id="historyCount"
                            name="historyCount"
                            value={prefs.historyCount}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow duration-200 text-slate-200"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition-colors duration-200"
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );
};