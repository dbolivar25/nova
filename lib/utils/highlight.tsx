import React from "react";

/**
 * Highlights search terms in text
 * @param text - The text to search in
 * @param searchTerm - The term to highlight
 * @returns JSX with highlighted terms
 */
export function highlightText(text: string, searchTerm: string): React.ReactElement {
  if (!searchTerm || !text) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.toLowerCase() === searchTerm.toLowerCase()) {
          return (
            <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded">
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

/**
 * Truncates text and shows snippet around search term
 * @param text - The full text
 * @param searchTerm - The search term
 * @param maxLength - Maximum length of snippet
 * @returns Truncated text with search term in context
 */
export function getSearchSnippet(text: string, searchTerm: string, maxLength: number = 150): string {
  if (!searchTerm || !text) {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  }

  const searchIndex = text.toLowerCase().indexOf(searchTerm.toLowerCase());
  
  if (searchIndex === -1) {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  }

  // Calculate snippet boundaries
  const snippetStart = Math.max(0, searchIndex - 50);
  const snippetEnd = Math.min(text.length, searchIndex + searchTerm.length + 100);
  
  let snippet = text.substring(snippetStart, snippetEnd);
  
  if (snippetStart > 0) {
    snippet = '...' + snippet;
  }
  if (snippetEnd < text.length) {
    snippet = snippet + '...';
  }
  
  return snippet;
}