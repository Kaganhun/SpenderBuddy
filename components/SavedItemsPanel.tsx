import React, { useState } from 'react';
import type { SavedItem } from '../types';

interface SavedItemsPanelProps {
    savedItems: SavedItem[];
    onSelect: (item: SavedItem) => void;
    onDelete: (timestamp: number) => void;
    onClear: () => void;
    onUpdateNote: (timestamp: number, note: string) => void;
    onGenerateImage: (timestamp: number) => Promise<void>;
}

const BookmarkIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
);

const TrashIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const EditIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

const ImageIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const SavedItemsPanel: React.FC<SavedItemsPanelProps> = ({ savedItems, onSelect, onDelete, onClear, onUpdateNote, onGenerateImage }) => {
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [noteText, setNoteText] = useState('');
    const [generatingImageId, setGeneratingImageId] = useState<number | null>(null);

    const handleEditClick = (item: SavedItem) => {
        setEditingItemId(item.savedAt);
        setNoteText(item.note || '');
    };

    const handleSaveClick = () => {
        if (editingItemId) {
            onUpdateNote(editingItemId, noteText);
            setEditingItemId(null);
            setNoteText('');
        }
    };

    const handleCancelClick = () => {
        setEditingItemId(null);
        setNoteText('');
    };
    
    const handleGenerateClick = async (timestamp: number) => {
        setGeneratingImageId(timestamp);
        try {
            await onGenerateImage(timestamp);
        } catch (e) {
            console.error("Image generation failed in component", e);
            alert("Sorry, we couldn't generate an image for this item. Please try again later.");
        } finally {
            setGeneratingImageId(null);
        }
    };

    return (
        <div className="mt-12 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-200 flex items-center gap-3">
                    <BookmarkIcon />
                    Saved Results
                </h2>
                <button 
                    onClick={onClear} 
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors duration-200 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700/50 border border-slate-700">
                    <TrashIcon />
                    Clear All
                </button>
            </div>
            <div className="space-y-4">
                {savedItems.map((item) => {
                    const displayQuery = item.query2 ? `${item.query} vs ${item.query2}` : item.query;
                    const isEditing = editingItemId === item.savedAt;
                    
                    return (
                        <div
                            key={item.savedAt}
                            className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg flex flex-col group transition-all duration-200"
                        >
                            <div className="flex justify-between items-start">
                                <div 
                                    className="flex-grow cursor-pointer min-w-0"
                                    onClick={() => !isEditing && onSelect(item)}
                                    onKeyDown={(e) => !isEditing && (e.key === 'Enter' || e.key === ' ') && onSelect(item)}
                                    role="button"
                                    tabIndex={isEditing ? -1 : 0}
                                    title={`Select: ${displayQuery}`}
                                >
                                    <p className="font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors">{displayQuery}</p>
                                    <p className="text-xs text-slate-500 mt-1">{new Date(item.savedAt).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center ml-4 flex-shrink-0">
                                    {!isEditing && (
                                        <button
                                            onClick={() => handleEditClick(item)}
                                            className="p-2 rounded-full bg-slate-700 text-slate-400 hover:bg-blue-600 hover:text-white transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title={item.note ? 'Edit note' : 'Add note'}
                                            aria-label={item.note ? 'Edit note' : 'Add note'}
                                        >
                                            <EditIcon />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDelete(item.savedAt)}
                                        className="ml-2 p-2 rounded-full bg-slate-700 text-slate-400 hover:bg-red-500 hover:text-white transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Delete saved item"
                                        aria-label="Delete saved item"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-3">
                                {isEditing ? (
                                    <div className="animate-fade-in">
                                        <textarea
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            placeholder="Add a note or tags..."
                                            className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow duration-200 text-slate-200 placeholder-slate-400"
                                            rows={2}
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button 
                                                onClick={handleCancelClick}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-600 hover:bg-slate-500 text-slate-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSaveClick}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                            >
                                                Save Note
                                            </button>
                                        </div>
                                    </div>
                                ) : item.note ? (
                                    <p className="text-sm text-slate-300 bg-slate-700/50 p-3 rounded-md whitespace-pre-wrap">
                                        {item.note}
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-500 italic group-hover:text-slate-400 transition-colors">No note added.</p>
                                )}
                            </div>

                            {!item.imageUrl && !isEditing && (
                                <div className="mt-3 border-t border-slate-700/50 pt-3">
                                    <button
                                        onClick={() => handleGenerateClick(item.savedAt)}
                                        disabled={generatingImageId !== null}
                                        className="flex w-full sm:w-auto items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Generate an image for this saved item"
                                    >
                                        {generatingImageId === item.savedAt ? (
                                            <>
                                                <SpinnerIcon />
                                                <span>Generating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon />
                                                <span>Generate Image</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};