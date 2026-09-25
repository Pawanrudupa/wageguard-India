/**
 * Accessible neo-brutalist combobox dropdown with keyboard navigation and custom chevron.
 */

import React, { useState, useRef, useEffect, useId } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | ComboboxOption)[];
  placeholder?: string;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}) => {
  const generatedId = useId();
  const comboboxId = id || generatedId;
  const listboxId = `${comboboxId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options into { value, label } objects
  const normalizedOptions: ComboboxOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  // Selected option label
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm("");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
      e.preventDefault();
      handleSelect(filteredOptions[highlightedIndex].value);
    } else if (e.key === "Tab") {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={comboboxId}
          className="block font-heading font-bold text-sm text-ink mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Combobox Trigger Button */}
      <button
        id={comboboxId}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[44px] px-3.5 py-2.5 bg-bg border-3 border-ink font-body text-base text-ink flex items-center justify-between gap-2 shadow-brutal-sm hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent text-left cursor-pointer transition-colors"
      >
        <span className={value ? "text-ink font-medium truncate" : "text-ink/60 truncate"}>
          {displayLabel}
        </span>

        {/* Custom Neo-Brutalist Chevron */}
        <span
          className={`flex-shrink-0 w-6 h-6 border-2 border-ink bg-surface flex items-center justify-center font-mono text-xs font-black transition-transform duration-150 ${
            isOpen ? "rotate-180 bg-accent" : ""
          }`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 border-3 border-ink bg-surface shadow-brutal max-h-60 overflow-hidden flex flex-col">
          {/* Quick search input */}
          <div className="p-2 border-b-2 border-ink/20 bg-bg">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type to filter..."
              className="w-full min-h-[36px] px-2.5 py-1 text-sm bg-surface border-2 border-ink font-body text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Listbox Items */}
          <ul
            id={listboxId}
            role="listbox"
            className="overflow-y-auto max-h-48 divide-y divide-ink/10"
          >
            {filteredOptions.length === 0 ? (
              <li className="p-3 text-xs font-mono text-ink/60 text-center">
                No matching options
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`min-h-[44px] px-3.5 py-2.5 flex items-center justify-between text-sm font-body cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-accent text-ink font-bold"
                        : isHighlighted
                        ? "bg-bg text-ink font-medium"
                        : "text-ink hover:bg-bg"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <span className="ml-2 font-mono text-xs font-black">✓</span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
