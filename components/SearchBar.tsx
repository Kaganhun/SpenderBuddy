import React, { useRef } from 'react';
import type { ImageQuery } from '../types';

type SearchMode = 'single' | 'compare';

interface SearchBarProps {
    onSearch: () => void;
    isLoading: boolean;
    onClear: () => void;
    hasContent: boolean;
    query1: string;
    setQuery1: (q: string) => void;
    query2: string;
    setQuery2: (q: string) => void;
    searchMode: SearchMode;
    setSearchMode: (m: SearchMode) => void;
    imageQuery: ImageQuery | null;
    setImageQuery: (img: ImageQuery | null) => void;
}

const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const mimeType = result.split(',')[0].split(':')[1].split(';')[0];
            const data = result.split(',')[1];
            resolve({ mimeType, data });
        };
        reader.onerror = error => reject(error);
    });
};

const SearchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
);

const CameraIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H12a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        <path d="M15 9a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SearchInput: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    disabled: boolean;
}> = ({ value, onChange, placeholder, disabled }) => (
     <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow duration-200 text-slate-200 placeholder-slate-500"
        disabled={disabled}
        autoComplete="off"
    />
);

export const SearchBar: React.FC<SearchBarProps> = (props) => {
    const {
        onSearch, isLoading, onClear, hasContent,
        query1, setQuery1, query2, setQuery2, searchMode, setSearchMode,
        imageQuery, setImageQuery
    } = props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch();
    };
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const image = await fileToBase64(file);
                setImageQuery(image);
            } catch (error) {
                console.error("Error converting file to base64", error);
            }
        }
        // Reset file input value to allow re-uploading the same file
        if (e.target) {
            e.target.value = '';
        }
    };
    
    const handleClearClick = () => {
        onClear();
    };

    const showClearButton = !isLoading && (query1.length > 0 || query2.length > 0 || hasContent || !!imageQuery);
    const isSearchDisabled = isLoading || (!query1.trim() && !imageQuery) || (searchMode === 'compare' && !query2.trim());

    return (
        <div className="relative">
             <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex justify-center mb-2">
                    <div className="flex items-center p-1 bg-slate-800 rounded-full border border-slate-700">
                         <button type="button" onClick={() => setSearchMode('single')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${searchMode === 'single' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
                            Single Search
                        </button>
                        <button type="button" onClick={() => setSearchMode('compare')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${searchMode === 'compare' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
                            Compare
                        </button>
                    </div>
                </div>

                <div className={`flex flex-col sm:flex-row gap-3 ${searchMode === 'single' ? 'animate-fade-in' : ''}`}>
                    <div className="relative flex-grow flex items-center gap-2">
                        {searchMode === 'single' && imageQuery && (
                            <div className="relative animate-fade-in group">
                                <img
                                    src={`data:${imageQuery.mimeType};base64,${imageQuery.data}`}
                                    alt="Image preview"
                                    className="h-12 w-12 object-cover rounded-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => setImageQuery(null)}
                                    className="absolute -top-1.5 -right-1.5 bg-slate-600 hover:bg-red-500 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100"
                                    aria-label="Remove image"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        )}
                        <div className="w-full">
                            <SearchInput 
                                value={query1}
                                onChange={(e) => setQuery1(e.target.value)}
                                placeholder={
                                    searchMode === 'compare' ? 'Product 1, e.g., "iPhone 15 Pro"' :
                                    imageQuery ? 'Add details (optional)...' :
                                    'e.g., "Best noise-cancelling headphones"'
                                }
                                disabled={isLoading}
                            />
                        </div>
                         {searchMode === 'single' && (
                             <>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Search with an image"
                                    disabled={isLoading}
                                >
                                    <CameraIcon />
                                </button>
                            </>
                        )}
                    </div>
                </div>
                
                 {searchMode === 'compare' && (
                    <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
                        <div className="relative flex-grow">
                             <SearchInput 
                                value={query2}
                                onChange={(e) => setQuery2(e.target.value)}
                                placeholder='Product 2, e.g., "Google Pixel 8 Pro"'
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                 )}


                <div className="flex flex-col sm:flex-row gap-3 mt-1">
                    <button
                        type="submit"
                        className="flex-grow flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
                        disabled={isSearchDisabled}
                    >
                        <SearchIcon />
                        <span>{isLoading ? 'Researching...' : 'Research'}</span>
                    </button>
                    {showClearButton && (
                        <button
                            type="button"
                            onClick={handleClearClick}
                            title="Clear search and results"
                            className="flex items-center justify-center px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-colors duration-200"
                        >
                            <span>Clear</span>
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};
