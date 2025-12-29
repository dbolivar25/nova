"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils/index";
import { Badge } from "./badge";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
  minTags?: number;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Type and press Enter...",
  suggestions = [],
  maxTags,
  disabled = false,
  className,
  error,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue.trim()) return suggestions.filter((s) => !value.includes(s));
    return suggestions.filter(
      (s) =>
        s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
    );
  }, [inputValue, suggestions, value]);

  const addTag = React.useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim();
      if (!trimmedTag) return;
      if (value.includes(trimmedTag)) return;
      if (maxTags && value.length >= maxTags) return;

      onChange([...value, trimmedTag]);
      setInputValue("");
    },
    [value, onChange, maxTags]
  );

  const removeTag = React.useCallback(
    (tagToRemove: string) => {
      onChange(value.filter((tag) => tag !== tagToRemove));
    },
    [value, onChange]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeTag(value[value.length - 1]);
      }
    },
    [inputValue, value, addTag, removeTag]
  );

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const showSuggestions = isFocused && filteredSuggestions.length > 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={handleContainerClick}
        className={cn(
          "flex min-h-[80px] w-full flex-wrap gap-2 rounded-md border bg-transparent px-3 py-2 text-sm transition-colors",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          error && "border-destructive ring-destructive/20",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 pr-1 text-sm font-normal"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag}</span>
              </button>
            )}
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow clicking suggestions
            setTimeout(() => setIsFocused(false), 150);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled || (maxTags !== undefined && value.length >= maxTags)}
          className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground mr-1">Suggestions:</span>
          {filteredSuggestions.slice(0, 8).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                "border-dashed border-muted-foreground/40 text-muted-foreground",
                "hover:border-primary hover:text-primary hover:bg-primary/5"
              )}
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
