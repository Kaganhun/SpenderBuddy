import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { researchProduct, compareProducts, researchWithImage, getImageUrl, getComparisonImageUrl } from './services/geminiService';
import type { ResearchResult } from './services/geminiService';
import { HistoryPanel, type HistoryItem } from './components/HistoryPanel';
import { PreferencesModal } from './components/PreferencesModal';
import type { Preferences, ImageQuery, FilterCategory, SavedItem, GroundingChunk, GroundingChunkWeb } from './types';
import { FilterPanel } from './components/FilterPanel';
import { SavedItemsPanel } from './components/SavedItemsPanel';
import { GenerateContentResponse } from '@google/genai';

const DEFAULT_PREFERENCES: Preferences = {
    historyCount: 10,
};

type SearchMode = 'single' | 'compare';

const App: React.FC = () => {
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [result, setResult] = useState<ResearchResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [query1, setQuery1] = useState('');
    const [query2, setQuery2] = useState('');
    const [searchMode, setSearchMode] = useState<SearchMode>('single');
    const [imageQuery, setImageQuery] = useState<ImageQuery | null>(null);

    // State for filters
    const [availableFilters, setAvailableFilters] = useState<FilterCategory[]>([]);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});

    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try {
            const savedHistory = localStorage.getItem('spender-buddy-history');
            if (savedHistory) {
                const parsed = JSON.parse(savedHistory);
                // Ensure every loaded item conforms to the HistoryItem interface by adding imageUrl: null
                return parsed.map((item: any) => ({ ...item, imageUrl: null }));
            }
            return [];
        } catch (error) {
            console.error("Could not load history from localStorage", error);
            return [];
        }
    });
    
    const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
        try {
            const saved = localStorage.getItem('spender-buddy-saved-items');
             if (saved) {
                const parsed = JSON.parse(saved);
                // Ensure every loaded item conforms to the SavedItem interface by adding imageUrl: null
                return parsed.map((item: any) => ({ ...item, imageUrl: null }));
            }
            return [];
        } catch (error) {
            console.error("Could not load saved items from localStorage", error);
            return [];
        }
    });

    const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
    const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
    
    useEffect(() => {
        try {
            const savedPrefs = localStorage.getItem('spender-buddy-prefs');
            if (savedPrefs) {
                setPreferences(prev => ({ ...prev, ...JSON.parse(savedPrefs) }));
            }
        } catch (error) {
            console.error("Could not load preferences from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            // Create a "lean" version of history for storage by removing bulky image data.
            const storableHistory = history.map(({ imageUrl, ...item }) => item);
            localStorage.setItem('spender-buddy-history', JSON.stringify(storableHistory));
        } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                 console.error("Could not save history to localStorage: Quota exceeded. The history is too large.");
            } else {
                console.error("Could not save history to localStorage", error);
            }
        }
    }, [history]);
    
    useEffect(() => {
        try {
            // Create a "lean" version of saved items for storage by removing bulky image data.
            const storableSavedItems = savedItems.map(({ imageUrl, ...item }) => item);
            localStorage.setItem('spender-buddy-saved-items', JSON.stringify(storableSavedItems));
        } catch (error) {
             if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                 console.error("Could not save items to localStorage: Quota exceeded. The saved items list is too large.");
            } else {
                console.error("Could not save items to localStorage", error);
            }
        }
    }, [savedItems]);
    
    const handleSavePreferences = (newPrefs: Preferences) => {
        setPreferences(newPrefs);
        setHistory(prev => prev.slice(0, newPrefs.historyCount));
        try {
            localStorage.setItem('spender-buddy-prefs', JSON.stringify(newPrefs));
        } catch (error) {
            console.error("Could not save preferences to localStorage", error);
        }
        setIsPreferencesOpen(false);
    };
    
    const performSearch = useCallback(async (isNewSearch: boolean = false) => {
        const isComparing = searchMode === 'compare';
        const finalQuery1 = query1.trim();
        const finalQuery2 = query2.trim();

        if (!finalQuery1 && !imageQuery) {
            setError("Please enter a product or upload an image to research.");
            return;
        }
        if (isComparing && !finalQuery2) {
            setError("Please enter the second product to compare.");
            return;
        }
        if (isComparing && imageQuery) {
            setError("Image search is not available in comparison mode.");
            return;
        }

        setIsSearching(true);
        setIsStreaming(true);
        setResult(null); // Clear previous results immediately
        setError(null);
        
        if (isNewSearch) {
            setAvailableFilters([]);
            setAppliedFilters({});
        }

        try {
            const currentAppliedFilters = isNewSearch ? {} : appliedFilters;
            
            const researchCall = imageQuery
                ? researchWithImage(imageQuery, finalQuery1)
                : isComparing
                ? compareProducts(finalQuery1, finalQuery2)
                : researchProduct(finalQuery1, currentAppliedFilters);

            const { stream, imagePromise: initialImagePromise } = await researchCall;
            
            // Initialize result state for streaming
            setResult({ response: '', sources: [], imageUrl: null, filters: [] });

            let fullResponseText = '';
            let finalResponse: GenerateContentResponse | undefined;

            // Handle image generation in parallel
            let imagePromise = initialImagePromise;
            if (imageQuery && !imagePromise) {
                // For image-based search, generate a new image based on the response
                imagePromise = getImageUrl(`A creative product-style image based on the item in the user's uploaded photo.`);
            }

            imagePromise?.then(url => {
                 setResult(prev => prev ? { ...prev, imageUrl: url } : null);
            });
            
            // Process the text stream
            for await (const chunk of stream) {
                fullResponseText += chunk.text;
                finalResponse = chunk; // Keep the last chunk for metadata
                setResult(prev => prev ? { ...prev, response: fullResponseText } : null);
            }

            // Once streaming is complete, parse the full response for metadata
            setIsStreaming(false);
            const groundingMetadata = finalResponse?.candidates?.[0]?.groundingMetadata;
            const sources: GroundingChunk[] = groundingMetadata?.groundingChunks?.filter((chunk): chunk is { web: GroundingChunkWeb } => !!chunk.web) || [];
            
            let finalFilters: FilterCategory[] | undefined = [];
            try {
                const startIndex = fullResponseText.indexOf('{');
                const endIndex = fullResponseText.lastIndexOf('}');
                if (startIndex !== -1 && endIndex !== -1) {
                    const jsonString = fullResponseText.substring(startIndex, endIndex + 1);
                    const parsed = JSON.parse(jsonString);
                    fullResponseText = parsed.summary || fullResponseText;
                    finalFilters = parsed.filters;
                }
            } catch (e) {
                console.warn("Could not parse JSON for filters from response.", e);
            }

            const finalResult: ResearchResult = {
                response: fullResponseText,
                sources: sources,
                imageUrl: await imagePromise, // Ensure image is resolved before final state
                filters: finalFilters
            };
            
            setResult(finalResult);

            if (isNewSearch && finalFilters && finalFilters.length > 0) {
                setAvailableFilters(finalFilters);
            }
            
            if (isNewSearch) {
                 const newHistoryItem: HistoryItem = {
                    ...finalResult,
                    query: imageQuery ? (finalQuery1 || `Image Search: ${new Date().toLocaleTimeString()}`) : finalQuery1,
                    query2: isComparing ? finalQuery2 : undefined,
                    timestamp: Date.now(),
                };
                setHistory(prevHistory => [newHistoryItem, ...prevHistory].slice(0, preferences.historyCount));
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(errorMessage);
            setIsStreaming(false);
        } finally {
            setIsSearching(false);
        }
    }, [query1, query2, searchMode, preferences, imageQuery, appliedFilters]);
    
    const handleFilterChange = (category: string, option: string) => {
        const newAppliedFilters = {
            ...appliedFilters,
            [category]: option,
        };
        if (!option || option === 'All') {
            delete newAppliedFilters[category];
        }
        setAppliedFilters(newAppliedFilters);
    };

    useEffect(() => {
        if (Object.keys(appliedFilters).length > 0 || (result && availableFilters.length > 0)) {
            if (query1.trim() || imageQuery) {
                performSearch(false);
            }
        }
    }, [appliedFilters]);

    const handleSelectHistory = (item: HistoryItem) => {
        setResult({ response: item.response, sources: item.sources, imageUrl: item.imageUrl, filters: item.filters });
        setQuery1(item.query);
        setQuery2(item.query2 || '');
        setSearchMode(item.query2 ? 'compare' : 'single');
        setAvailableFilters(item.filters || []);
        setAppliedFilters({});
        setImageQuery(null);
        setError(null);
        setIsSearching(false);
        setIsStreaming(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleClearHistory = () => {
        setHistory([]);
    };

    const handleSaveResult = useCallback(() => {
        if (!result || isStreaming) return;
        
        const alreadyExists = savedItems.some(item => item.response === result.response);
        if (alreadyExists) {
            console.log("Result already saved.");
            return;
        }

        const newSavedItem: SavedItem = {
            ...result,
            query: imageQuery ? (query1.trim() || `Image Search`) : query1.trim(),
            query2: searchMode === 'compare' ? query2.trim() : undefined,
            savedAt: Date.now(),
        };
        setSavedItems(prev => [newSavedItem, ...prev]);
    }, [result, query1, query2, searchMode, imageQuery, savedItems, isStreaming]);

    const handleSelectSavedItem = (item: SavedItem) => {
        setResult({ response: item.response, sources: item.sources, imageUrl: item.imageUrl, filters: item.filters });
        setQuery1(item.query);
        setQuery2(item.query2 || '');
        setSearchMode(item.query2 ? 'compare' : 'single');
        setAvailableFilters(item.filters || []);
        setAppliedFilters({});
        setImageQuery(null);
        setError(null);
        setIsSearching(false);
        setIsStreaming(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteSavedItem = (savedAt: number) => {
        setSavedItems(prev => prev.filter(item => item.savedAt !== savedAt));
    };

    const handleUpdateSavedItemNote = (savedAt: number, note: string) => {
        setSavedItems(prev => prev.map(item =>
            item.savedAt === savedAt ? { ...item, note } : item
        ));
    };
    
    const handleGenerateSavedItemImage = async (savedAt: number) => {
        const itemToUpdate = savedItems.find(item => item.savedAt === savedAt);
        if (!itemToUpdate || itemToUpdate.imageUrl) {
            console.warn("Attempted to generate image for an item that already has one or doesn't exist.");
            return;
        }

        try {
            let newImageUrl: string | null = null;
            if (itemToUpdate.query2) {
                newImageUrl = await getComparisonImageUrl(itemToUpdate.query, itemToUpdate.query2);
            } else {
                newImageUrl = await getImageUrl(itemToUpdate.query);
            }

            if (newImageUrl) {
                setSavedItems(prev => prev.map(item =>
                    item.savedAt === savedAt ? { ...item, imageUrl: newImageUrl } : item
                ));
            } else {
                throw new Error("Image generation returned no URL.");
            }
        } catch (err) {
            console.error("Error generating image for saved item:", err);
            throw err; // Re-throw to allow caller to handle UI state
        }
    };

    const handleClearSavedItems = () => {
        setSavedItems([]);
    };

    const handleClearSearch = useCallback(() => {
        setResult(null);
        setError(null);
        setIsSearching(false);
        setIsStreaming(false);
        setQuery1('');
        setQuery2('');
        setImageQuery(null);
        setAvailableFilters([]);
        setAppliedFilters({});
    }, []);

    const hasContent = !!result || !!error;

    return (
        <div className="bg-slate-900 min-h-screen text-slate-200 font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl mx-auto animate-fade-in">
                <Header onOpenPreferences={() => setIsPreferencesOpen(true)} />
                <main>
                    <SearchBar 
                        onSearch={() => performSearch(true)}
                        isLoading={isSearching} 
                        onClear={handleClearSearch}
                        hasContent={hasContent}
                        query1={query1}
                        setQuery1={setQuery1}
                        query2={query2}
                        setQuery2={setQuery2}
                        searchMode={searchMode}
                        setSearchMode={setSearchMode}
                        imageQuery={imageQuery}
                        setImageQuery={setImageQuery}
                    />
                    <div className="mt-8">
                        {isSearching && !result && <LoadingSpinner />}
                        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center animate-fade-in">{error}</div>}
                        
                        {result && (
                            <>
                                {availableFilters.length > 0 && (
                                    <FilterPanel 
                                        filters={availableFilters}
                                        appliedFilters={appliedFilters}
                                        onFilterChange={handleFilterChange}
                                        isLoading={isSearching}
                                    />
                                )}
                                <ResultsDisplay 
                                    response={result.response} 
                                    sources={result.sources} 
                                    imageUrl={result.imageUrl} 
                                    onSaveResult={handleSaveResult}
                                    isStreaming={isStreaming}
                                />
                            </>
                        )}
                    </div>
                     {savedItems.length > 0 && (
                        <SavedItemsPanel
                            savedItems={savedItems}
                            onSelect={handleSelectSavedItem}
                            onDelete={handleDeleteSavedItem}
                            onClear={handleClearSavedItems}
                            onUpdateNote={handleUpdateSavedItemNote}
                            onGenerateImage={handleGenerateSavedItemImage}
                        />
                    )}
                    {history.length > 0 && (
                        <HistoryPanel 
                            history={history} 
                            onSelect={handleSelectHistory}
                            onClear={handleClearHistory}
                        />
                    )}
                </main>
            </div>
            <PreferencesModal 
                isOpen={isPreferencesOpen}
                onClose={() => setIsPreferencesOpen(false)}
                onSave={handleSavePreferences}
                currentPreferences={preferences}
            />
        </div>
    );
};

export default App;