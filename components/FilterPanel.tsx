import React from 'react';
import type { FilterCategory } from '../types';

interface FilterPanelProps {
    filters: FilterCategory[];
    appliedFilters: Record<string, string>;
    onFilterChange: (category: string, option: string) => void;
    isLoading: boolean;
}

const FilterIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
);


export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, appliedFilters, onFilterChange, isLoading }) => {
    if (!filters || filters.length === 0) {
        return null;
    }
    
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, category: string) => {
        onFilterChange(category, e.target.value);
    };

    return (
        <div className="p-4 sm:p-6 bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg animate-fade-in mb-8">
             <h3 className="text-xl font-bold text-slate-200 flex items-center gap-3 mb-4">
                <FilterIcon />
                Refine Your Search
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filters.map(filter => (
                    <div key={filter.category}>
                        <label htmlFor={`filter-${filter.category}`} className="block text-sm font-medium text-slate-400 mb-1.5">
                            {filter.category}
                        </label>
                        <select
                            id={`filter-${filter.category}`}
                            name={filter.category}
                            value={appliedFilters[filter.category] || ''}
                            onChange={(e) => handleSelectChange(e, filter.category)}
                            disabled={isLoading}
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow duration-200 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">All</option>
                            {filter.options.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
};
