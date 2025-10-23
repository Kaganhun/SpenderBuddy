import React, { useState, useCallback, useEffect } from 'react';
import type { GroundingChunk } from '../types';

interface SourceLinkProps {
    source: GroundingChunk;
}

const SourceLink: React.FC<SourceLinkProps> = ({ source }) => (
    <a
        href={source.web.uri}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-slate-800 hover:bg-slate-700/50 transition-colors duration-200 p-3 rounded-lg text-sm border border-slate-700"
        title={source.web.title}
    >
        <p className="font-semibold text-blue-400 truncate">{source.web.title}</p>
        <p className="text-slate-500 text-xs truncate mt-1">{source.web.uri}</p>
    </a>
);

interface ResultsDisplayProps {
    response: string;
    sources: GroundingChunk[];
    imageUrl: string | null;
    onSaveResult: () => void;
    isStreaming: boolean;
}

const FormattedResponse: React.FC<{ text: string }> = ({ text }) => {
    // This function processes a single line of text for inline markdown.
    const processInlineFormatting = (line: string): React.ReactNode => {
        // Regex to find **bold** text or [links](url).
        // The `split` function with a capturing group keeps the delimiters, which we can then parse.
        const markdownRegex = /(\*\*[^*]+\*\*)|(\[.*?\]\(.*?\))/g;
        const parts = line.split(markdownRegex).filter(Boolean); // Split by bold/link patterns and remove empty strings.

        return parts.map((part, index) => {
            // Check for bold: **text**
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
            }

            // Check for link: [text](url) using a more robust regex that anchors to the start/end of the part.
            const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (linkMatch) {
                const [, linkText, linkUrl] = linkMatch;
                // Basic validation to ensure it's a real URL
                if (linkUrl && (linkUrl.startsWith('http://') || linkUrl.startsWith('https://'))) {
                    return (
                        <a href={linkUrl} key={index} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            {linkText}
                        </a>
                    );
                }
            }
            
            // If no match, return the text part as is
            return part;
        });
    };

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    let listItems: React.ReactNode[] = [];
    let tableRows: React.ReactNode[][] = [];
    let inTable = false;

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 pl-4 my-4">
                    {listItems}
                </ul>
            );
            listItems = [];
        }
    };

    const flushTable = () => {
        if (tableRows.length > 0) {
            const header = tableRows.shift();
            elements.push(
                <table key={`table-${elements.length}`}>
                    <thead>
                        <tr>{header?.map((cell, i) => <th key={i}>{cell}</th>)}</tr>
                    </thead>
                    <tbody>
                        {tableRows.map((row, i) => (
                            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                        ))}
                    </tbody>
                </table>
            );
            tableRows = [];
        }
        inTable = false;
    };


    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
            flushList();
            inTable = true;
            const cells = trimmedLine.split('|').slice(1, -1).map(cell => cell.trim());
            // Ignore separator line
            if (cells.every(cell => /^-+$/.test(cell.replace(/\s/g, '')))) {
                return;
            }
            tableRows.push(cells.map(cell => processInlineFormatting(cell)));
            return;
        }

        if (inTable) flushTable();

        if (trimmedLine.startsWith('* ')) {
            const itemText = trimmedLine.substring(2);
            listItems.push(<li key={index}>{processInlineFormatting(itemText)}</li>);
            return;
        }

        flushList();
        
        if (trimmedLine === '') return;
        
        const isHeading = trimmedLine.toUpperCase() === trimmedLine && 
                          trimmedLine.length > 3 && // Avoid short acronyms like "PROS"
                          !trimmedLine.includes(':') &&
                          !/[.!?]$/.test(trimmedLine) &&
                          isNaN(Number(trimmedLine));

        if (isHeading) {
            elements.push(<h3 key={index} className="text-xl font-bold mt-6 mb-3 text-slate-100 border-b border-slate-700 pb-2">{trimmedLine}</h3>);
        } else {
            elements.push(<p key={index} className="my-2">{processInlineFormatting(trimmedLine)}</p>);
        }
    });

    flushList();
    flushTable();

    return <>{elements}</>;
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ response, sources, imageUrl, onSaveResult, isStreaming }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copy');
    const [saveButtonText, setSaveButtonText] = useState('Save Result');

    useEffect(() => {
        setSaveButtonText('Save Result');
    }, [response]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(response).then(() => {
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy'), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setCopyButtonText('Error');
            setTimeout(() => setCopyButtonText('Copy'), 2000);
        });
    }, [response]);

    const handleSave = useCallback(() => {
        onSaveResult();
        setSaveButtonText('Saved!');
    }, [onSaveResult]);

    return (
        <div className="p-4 sm:p-6 bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-200">
                    Research Summary
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Save this result for later"
                        disabled={isStreaming || saveButtonText !== 'Save Result'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={saveButtonText === 'Saved!' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        {saveButtonText}
                    </button>
                    <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Copy summary to clipboard"
                        disabled={isStreaming || copyButtonText !== 'Copy'}
                    >
                        {copyButtonText}
                    </button>
                </div>
            </div>
            
            {imageUrl ? (
                <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
                    <img src={imageUrl} alt="AI-generated product visualization" className="w-full h-auto object-cover" />
                </div>
            ) : (
                <div className="mb-6 rounded-lg overflow-hidden bg-slate-700/50 aspect-video flex items-center justify-center">
                    <div className="text-center text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2 text-sm font-medium">Generating image...</p>
                    </div>
                </div>
            )}

            <div className="text-slate-300 leading-relaxed text-base">
                <FormattedResponse text={response} />
            </div>

            {sources.length > 0 && (
                <div className="mt-6 sm:mt-8 border-t border-slate-700 pt-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 text-slate-200">Where to Buy / Sources</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sources.map((source, index) => (
                            <SourceLink key={`${index}-${source.web.uri}`} source={source} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};