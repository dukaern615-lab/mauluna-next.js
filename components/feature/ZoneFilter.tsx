'use client';

import { useRef, useEffect, useState, memo, useMemo } from 'react';

interface ZoneFilterProps {
  selectedZones: string[];
  onZonesChange: (zones: string[]) => void;
  romeZones: Record<string, string[]>;
  zoneSearch: string;
  setZoneSearch: (search: string) => void;
  expandedMacroZones: string[];
  toggleMacroZoneExpansion: (zone: string) => void;
  handleZoneToggle: (zone: string) => void;
  handleMacroZoneToggle: (zone: string) => void;
  isMacroZoneSelected: (zone: string) => boolean;
  isMacroZonePartiallySelected: (zone: string) => boolean;
  getFilteredMacroZones: () => string[];
  getFilteredSubZones: (macroZone: string) => string[];
  handleSelectAllZones: () => void;
}

function ZoneFilter({
  selectedZones,
  romeZones,
  zoneSearch,
  setZoneSearch,
  expandedMacroZones,
  toggleMacroZoneExpansion,
  handleZoneToggle,
  handleMacroZoneToggle,
  isMacroZoneSelected,
  isMacroZonePartiallySelected,
  getFilteredMacroZones,
  getFilteredSubZones,
  handleSelectAllZones
}: ZoneFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getAllZones = () => {
    const allZones: string[] = [];
    Object.entries(romeZones).forEach(([macroZone, subZones]) => {
      allZones.push(macroZone);
      allZones.push(...subZones);
    });
    return allZones;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="h-10 w-full px-3 bg-white border border-gray-300 rounded-lg text-[#3D2817] focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860] text-left flex items-center justify-between text-sm cursor-pointer"
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <span className="truncate">
          {selectedZones.length === 0 
            ? 'Tutte le zone'
            : `${selectedZones.length} zona${selectedZones.length > 1 ? 'e' : ''} selezionata${selectedZones.length > 1 ? 'e' : ''}`
          }
        </span>
        <i className={`ri-arrow-down-s-line transition-transform ml-1 flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`}></i>
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] w-[400px] max-h-[350px] overflow-hidden">
          {/* Search Input with Icon */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              <input
                type="text"
                placeholder="Cerca zone..."
                value={zoneSearch}
                onChange={(e) => setZoneSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Select All */}
          <div className="px-3 py-2.5 border-b-2 border-gray-200 bg-gray-50">
            <label className="flex items-center gap-3 cursor-pointer min-h-[48px]">
              <input
                type="checkbox"
                checked={selectedZones.length === getAllZones().length}
                onChange={handleSelectAllZones}
                className="w-6 h-6 text-[#C47B5B] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-[#C47B5B] cursor-pointer flex-shrink-0"
              />
              <span className="text-base font-bold text-gray-800">
                Tutta Roma ({getAllZones().length} zone)
              </span>
            </label>
          </div>

          {/* Zones List - Enhanced Touch Targets & Visual Hierarchy */}
          <div className="overflow-y-auto max-h-[250px] custom-scrollbar">
            {getFilteredMacroZones().map((macroZone) => {
              const subZones = getFilteredSubZones(macroZone);
              const isExpanded = expandedMacroZones.includes(macroZone);
              const hasVisibleSubZones = subZones.length > 0;
              
              return (
                <div key={macroZone} className="border-b border-gray-100 last:border-b-0">
                  {/* Macro Zone - Improved Layout */}
                  <div className="flex items-center hover:bg-gray-50 min-h-[52px] transition-colors">
                    {/* Expand Button - More Prominent */}
                    <button
                      type="button"
                      onClick={() => toggleMacroZoneExpansion(macroZone)}
                      className="w-12 h-12 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0 cursor-pointer"
                    >
                      <i className={`ri-arrow-right-s-line text-2xl text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}></i>
                    </button>
                    
                    {/* Checkbox + Label - Better Touch Target */}
                    <label className="flex items-center flex-1 cursor-pointer gap-3 py-3 pr-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isMacroZoneSelected(macroZone)}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = isMacroZonePartiallySelected(macroZone);
                            }
                          }}
                          onChange={() => handleMacroZoneToggle(macroZone)}
                          className="w-6 h-6 text-[#C47B5B] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-[#C47B5B] cursor-pointer"
                        />
                      </div>
                      <span className="text-base font-semibold text-gray-800 flex-1">{macroZone}</span>
                      <span className="text-sm text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        {(romeZones[macroZone as keyof typeof romeZones] || []).length + 1}
                      </span>
                    </label>
                  </div>
                  
                  {/* Sub Zones - Enhanced Spacing */}
                  {isExpanded && hasVisibleSubZones && (
                    <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
                      <div className="py-2">
                        {subZones.map((subZone) => (
                          <label 
                            key={subZone} 
                            className="flex items-center gap-3 py-3 px-4 pl-12 cursor-pointer hover:bg-white transition-all min-h-[48px] group border-b border-gray-50 last:border-b-0"
                          >
                            <div className="relative flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={selectedZones.includes(subZone)}
                                onChange={() => handleZoneToggle(subZone)}
                                className="w-6 h-6 text-[#C47B5B] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-[#C47B5B] cursor-pointer"
                              />
                            </div>
                            <span className="text-base text-gray-700 font-medium group-hover:text-[#C47B5B] transition-colors">{subZone}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Count */}
          {selectedZones.length > 0 && (
            <div className="p-3 border-t border-[#E8E4E0] bg-[#F9F6F3]">
              <div className="mt-1 flex flex-wrap gap-1">
                {selectedZones.slice(0, 2).map((zone) => (
                  <span
                    key={zone}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#D97860] text-white"
                  >
                    {zone.length > 12 ? `${zone.substring(0, 12)}...` : zone}
                  </span>
                ))}
                {selectedZones.length > 2 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-600">
                    +{selectedZones.length - 2} altre
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(ZoneFilter);
