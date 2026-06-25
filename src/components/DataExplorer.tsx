import React, { useState } from 'react';
import { Place, Question } from '../types.js';
import { Search, Trash2, MapPin, Compass, Tag, Calendar, ChevronRight, X, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DataExplorerProps {
  places: Place[];
  questions: Question[];
  onDeletePlace: (id: string) => Promise<void>;
  loading: boolean;
}

export default function DataExplorer({ places, questions, onDeletePlace, loading }: DataExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'landmark' | 'city' | 'country'>('all');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to permanently delete "${name}" from the systems database? This will cascaded-delete all trivia questions linked to it.`)) {
      try {
        await onDeletePlace(id);
        if (selectedPlace?.id === id) {
          setSelectedPlace(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filter coordinates
  const filteredPlaces = places.filter((place) => {
    const matchesSearch = 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.city && place.city.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedTypeFilter === 'all' ? true : place.type === selectedTypeFilter;

    return matchesSearch && matchesType;
  });

  const getQuestionsForPlace = (placeId: string) => {
    return questions.filter(q => q.place_id === placeId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      
      {/* Search & Listings Panel */}
      <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden h-full">
        
        {/* Filter controls bar */}
        <div className="bg-[#0F1623] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row gap-4 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="explorer-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by place name, city, or country..."
              className="w-full bg-[#080C14] border border-slate-800 rounded pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] outline-none transition"
            />
          </div>

          <div className="flex gap-1 bg-[#080C14] border border-slate-800 p-1.5 rounded shrink-0 overflow-x-auto">
            {(['all', 'landmark', 'city', 'country'] as const).map((t) => (
              <button
                key={t}
                id={`filter-type-${t}`}
                onClick={() => setSelectedTypeFilter(t)}
                className={`px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded transition cursor-pointer ${
                  selectedTypeFilter === t
                    ? 'bg-[#00C2FF] text-[#080C14]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Places List */}
        <div className="bg-[#0F1623] border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden min-h-[300px]">
          <div className="p-5 bg-[#080C14]/50 border-b border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest shrink-0">
            <span>Place Name & Geobadge ({filteredPlaces.length})</span>
            <span>Controls</span>
          </div>

          <div className="divide-y divide-slate-800/60 overflow-y-auto w-full">
            {filteredPlaces.map((place) => {
              const placeQ = getQuestionsForPlace(place.id);
              const isSelected = selectedPlace?.id === place.id;

              return (
                <div
                  key={place.id}
                  id={`explorer-item-${place.id}`}
                  onClick={() => setSelectedPlace(place)}
                  className={`p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/20 transition ${
                    isSelected ? 'bg-sky-500/5 border-l-2 border-[#00C2FF]' : 'border-l-2 border-transparent'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base text-white font-bold truncate">{place.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0 ${
                        place.type === 'landmark' 
                          ? 'border-sky-500/30 text-sky-400 bg-sky-950/20' 
                          : place.type === 'city'
                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
                          : 'border-amber-500/30 text-amber-400 bg-amber-950/20'
                      }`}>
                        {place.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1.5 shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {place.city ? `${place.city}, ` : ''}{place.country}
                      </span>
                      <span className="hidden sm:inline text-slate-700">|</span>
                      <span className="shrink-0">
                        Coords: {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                      </span>
                      <span className="hidden sm:inline text-slate-700">|</span>
                      <span className="text-emerald-400 font-bold shrink-0">{placeQ.length} Questions</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      id={`btn-delete-place-${place.id}`}
                      onClick={() => handleDelete(place.id, place.name)}
                      disabled={loading}
                      className="p-2.5 border border-slate-800 hover:border-red-500/50 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                      title="Permanently Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </div>
                </div>
              );
            })}

            {filteredPlaces.length === 0 && (
              <div className="p-16 flex flex-col items-center justify-center text-center text-slate-500 font-mono">
                <Search className="w-8 h-8 text-slate-600 mb-3" />
                <p className="text-sm font-bold tracking-wider uppercase">No matching places</p>
                <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Details Side Drawer */}
      <div className="bg-[#0F1623] border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden text-slate-300">
        <AnimatePresence mode="wait">
          {selectedPlace ? (
            <motion.div
              key={selectedPlace.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-white font-mono leading-tight pr-4">{selectedPlace.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-wider">ID: {selectedPlace.id}</p>
                  </div>
                  <button
                    id="btn-close-drawer"
                    onClick={() => setSelectedPlace(null)}
                    className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                {/* Geographic stats list */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-[#080C14] border border-slate-800 p-3 rounded">
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Latitude</p>
                    <p className="text-slate-200 mt-1">{selectedPlace.latitude}</p>
                  </div>
                  <div className="bg-[#080C14] border border-slate-800 p-3 rounded">
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Longitude</p>
                    <p className="text-slate-200 mt-1">{selectedPlace.longitude}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Geographic Summary</span>
                  <p className="text-sm text-slate-300 italic bg-[#080C14] border border-slate-800 p-4 rounded leading-relaxed">
                    "{selectedPlace.description}"
                  </p>
                </div>

                {/* Tags panel */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Indexed Search Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlace.tags.map((tag, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700/60 font-semibold tracking-wider">
                        <Tag className="w-3 h-3 text-[#00C2FF]" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progressive Clues List */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 font-mono block">Progressive Clues (GuessMyPlace)</span>
                  <div className="space-y-2">
                    {selectedPlace.clues.map((clue, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-slate-800/30 border border-slate-800 rounded text-xs leading-relaxed">
                        <span className="font-mono text-[#00C2FF] font-black shrink-0 text-sm mt-0.5">#{idx + 1}</span>
                        <span className="text-slate-300">{clue}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connected trivia questions */}
                <div className="space-y-4 pt-6 border-t border-slate-800">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#00C2FF] font-mono block">Connected Trivia Questions</span>
                  {getQuestionsForPlace(selectedPlace.id).map((q, idx) => (
                    <div key={idx} className="bg-[#080C14] border border-slate-800 rounded-lg p-4 space-y-3">
                      <p className="font-bold text-white text-sm font-mono leading-relaxed">{q.text}</p>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2 border rounded truncate font-bold tracking-wider ${
                              opt === q.correct_answer 
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                                : 'bg-slate-800/50 border-slate-700 text-slate-400'
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-800/30 p-3 rounded border border-slate-800 mt-2">
                        <span className="text-slate-500 font-bold not-italic mr-1 uppercase">Explanation:</span> 
                        {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 font-mono p-8">
              <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mb-4">
                <Compass className="w-8 h-8 text-slate-600 animate-pulse" />
              </div>
              <p className="text-sm font-bold tracking-widest uppercase text-white">No Place Selected</p>
              <p className="text-[11px] text-slate-500 mt-2 max-w-xs leading-relaxed">
                Examine specific items, progressive clues, tag indexing, and connected trivia by selecting a record in the list.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
