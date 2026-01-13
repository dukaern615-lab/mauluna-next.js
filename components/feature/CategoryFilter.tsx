'use client';

import { useRef, useEffect, useState, memo } from 'react';

interface CategoryFilterProps {
  selectedMainCategory: string;
  selectedSubCategory: string;
  selectedSubSubCategory: string;
  onMainCategoryChange: (category: string) => void;
  onSubCategoryChange: (subCategory: string) => void;
  onSubSubCategoryChange: (subSubCategory: string) => void;
  getSubCategories: () => string[];
  getSubSubCategories: () => string[];
  propertyCategories: any;
  shouldShowBusinessActivity: boolean;
  businessActivities: string[];
  filteredBusinessActivities: string[];
  selectedBusinessActivities: string[];
  businessSearch: string;
  setBusinessSearch: (search: string) => void;
  handleBusinessActivityToggle: (activity: string) => void;
  handleSelectAllBusiness: () => void;
  hideMobileBusinessActivities?: boolean;
}

function CategoryFilter({
  selectedMainCategory,
  selectedSubCategory,
  selectedSubSubCategory,
  onMainCategoryChange,
  onSubCategoryChange,
  onSubSubCategoryChange,
  getSubCategories,
  getSubSubCategories,
  shouldShowBusinessActivity,
  filteredBusinessActivities,
  selectedBusinessActivities,
  businessSearch,
  setBusinessSearch,
  handleBusinessActivityToggle,
  handleSelectAllBusiness,
  hideMobileBusinessActivities = false
}: CategoryFilterProps) {
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [dropdownAlignment, setDropdownAlignment] = useState<'left-0' | 'right-0'>('right-0');
  const businessDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (businessDropdownRef.current && !businessDropdownRef.current.contains(event.target as Node)) {
        setShowBusinessDropdown(false);
      }
    };

    if (showBusinessDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBusinessDropdown]);

  return (
    <div className="flex flex-col lg:flex-row lg:items-end gap-2 lg:gap-3 w-full relative z-10">
      {/* Main Category */}
      <div className="w-full lg:w-auto lg:flex-shrink-0">
        <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
        <select
          value={selectedMainCategory}
          onChange={(e) => onMainCategoryChange(e.target.value)}
          className="h-10 w-full lg:w-auto lg:min-w-[150px] px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860] cursor-pointer"
        >
          <option value="">Tutte le categorie</option>
          <option value="Case-Appartamenti">Case-Appartamenti</option>
          <option value="Commerciale">Commerciale</option>
          <option value="Ufficio">Ufficio</option>
          <option value="Garage-Posti auto">Garage-Posti auto</option>
          <option value="Magazzini-Depositi">Magazzini-Depositi</option>
          <option value="Capannoni">Capannoni</option>
          <option value="Terreni">Terreni</option>
          <option value="Nuove Costruzioni">Nuove Costruzioni</option>
        </select>
      </div>

      {/* Sub Category */}
      {selectedMainCategory && getSubCategories().length > 0 && (
        <div className="w-full lg:w-auto lg:flex-shrink-0">
          <label className="block text-xs font-medium text-gray-600 mb-1 lg:invisible">Sottocategoria</label>
          <select
            value={selectedSubCategory}
            onChange={(e) => onSubCategoryChange(e.target.value)}
            className="h-10 lg:h-10 w-full lg:w-auto lg:min-w-[150px] px-4 lg:px-3 bg-white border-2 lg:border border-gray-200 lg:border-gray-300 rounded-xl lg:rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860] cursor-pointer transition-all"
            style={{ pointerEvents: 'auto' }}
          >
            <option value="">Tutti i tipi</option>
            {getSubCategories().map((subCategory) => (
              <option key={subCategory} value={subCategory}>
                {subCategory}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Business Activity Dropdown */}
      {shouldShowBusinessActivity && !hideMobileBusinessActivities && (
        <div className="relative w-full lg:w-auto lg:flex-shrink-0 z-[110]" ref={businessDropdownRef}>
          <label className="block text-xs font-medium text-gray-600 mb-1 lg:invisible">Attività</label>
          <button
            type="button"
            onClick={() => {
              if (businessDropdownRef.current) {
                const rect = businessDropdownRef.current.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const containerRect = businessDropdownRef.current.closest('.max-w-7xl')?.getBoundingClientRect();
                const dropdownWidth = 350;
                const wouldOverflowRight = rect.right > (containerRect?.right || viewportWidth) - dropdownWidth;
                setDropdownAlignment(wouldOverflowRight ? 'right-0' : 'left-0');
              }
              setShowBusinessDropdown(!showBusinessDropdown);
            }}
            className="h-10 w-full lg:w-auto lg:min-w-[180px] px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860] text-left flex items-center justify-between cursor-pointer"
            aria-expanded={showBusinessDropdown}
            aria-haspopup="true"
          >
            <span className="truncate flex-1 min-w-0">
              {selectedBusinessActivities.length === 0 
                ? 'Seleziona attività...'
                : selectedBusinessActivities.length === 1
                ? selectedBusinessActivities[0]
                : `${selectedBusinessActivities.length} selezionate`
              }
            </span>
            <i className={`ri-arrow-down-s-line transition-transform ml-1 ${showBusinessDropdown ? 'rotate-180' : ''}`}></i>
          </button>

          {showBusinessDropdown && (
            <div className={`absolute top-full ${dropdownAlignment} mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[200] w-[350px] max-h-[320px] overflow-hidden`}>
              {/* Search with Icon */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                  <input
                    type="text"
                    placeholder="Cerca attività..."
                    value={businessSearch}
                    onChange={(e) => setBusinessSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860]"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Select All - Enhanced */}
              <div className="px-4 py-3 border-b-2 border-gray-200 bg-gray-50">
                <label className="flex items-center gap-3 cursor-pointer min-h-[48px]">
                  <input
                    type="checkbox"
                    checked={selectedBusinessActivities.length === filteredBusinessActivities.length && filteredBusinessActivities.length > 0}
                    onChange={handleSelectAllBusiness}
                    className="w-6 h-6 text-[#C47B5B] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-[#C47B5B] cursor-pointer flex-shrink-0"
                  />
                  <span className="text-base font-bold text-gray-800">
                    Seleziona Tutte ({filteredBusinessActivities.length})
                  </span>
                </label>
              </div>

              {/* List - Enhanced Spacing & Touch Targets */}
              <div className="overflow-y-auto max-h-[200px] custom-scrollbar">
                <div className="py-2">
                  {filteredBusinessActivities.map((activity) => (
                    <label
                      key={activity}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors min-h-[50px] group border-b border-gray-50 last:border-b-0"
                    >
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedBusinessActivities.includes(activity)}
                          onChange={() => handleBusinessActivityToggle(activity)}
                          className="w-6 h-6 text-[#C47B5B] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-[#C47B5B] cursor-pointer"
                        />
                      </div>
                      <span className="text-base text-gray-700 font-medium group-hover:text-[#C47B5B] transition-colors leading-snug">{activity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Selected count */}
              {selectedBusinessActivities.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50">
                  <span className="text-sm font-medium text-gray-600">{selectedBusinessActivities.length} selezionate</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sub-Sub Category */}
      {selectedSubCategory && getSubSubCategories().length > 0 && (
        <div className="w-full lg:w-auto lg:flex-shrink-0">
          <label className="block text-xs font-medium text-gray-600 mb-1 lg:invisible">Dettaglio</label>
          <select
            value={selectedSubSubCategory}
            onChange={(e) => onSubSubCategoryChange(e.target.value)}
            className="h-10 w-full lg:w-auto lg:min-w-[140px] px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D97860] focus:border-[#D97860] cursor-pointer"
          >
            <option value="">Tutti</option>
            {getSubSubCategories().map((subSubCategory) => (
              <option key={subSubCategory} value={subSubCategory}>
                {subSubCategory}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default memo(CategoryFilter);
