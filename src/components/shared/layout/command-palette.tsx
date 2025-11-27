"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/shared/ui/command";
import { Badge } from "@/components/shared/ui/badge";
import { Skeleton } from "@/components/shared/ui/skeleton";
import {
  Brain,
  Calendar,
  ChartBar,
  ChevronRight,
  FileJson,
  FileText,
  History,
  Home,
  LogOut,
  Clock3,
  Moon,
  PenLine,
  Plus,
  Search,
  MessageCircle,
  Sun,
  Sunset,
  Monitor,
  User,
} from "lucide-react";
import { useJournalEntries, useJournalSearch } from "@/features/journal/hooks/use-journal";
import { getSearchSnippet, highlightText } from "@/shared/lib/utils/highlight";
import { toast } from "sonner";
import { SignOutButton } from "@clerk/nextjs";
import type { JournalEntry, Mood } from "@/features/journal/types/journal";
import { ThemePreference } from "@/shared/lib/theme-preferences";
import { useThemePreference } from "@/shared/hooks/use-theme-preference";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const moodIcons: Record<Mood, React.ComponentType<{ className?: string }>> = {
  positive: () => <span className="text-lg">😊</span>,
  negative: () => <span className="text-lg">😔</span>,
  neutral: () => <span className="text-lg">😐</span>,
  thoughtful: () => <span className="text-lg">🤔</span>,
  grateful: () => <span className="text-lg">🙏</span>,
  anxious: () => <span className="text-lg">😰</span>,
  excited: () => <span className="text-lg">🎉</span>,
  sad: () => <span className="text-lg">😢</span>,
  angry: () => <span className="text-lg">😠</span>,
  peaceful: () => <span className="text-lg">😌</span>,
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { preference: themePreference, setPreference: setThemePreference } = useThemePreference();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch recent entries when no search
  // Load more entries so cmdk has enough to filter through (e.g., find "Thursday" entries)
  const { data: recentData } = useJournalEntries(
    30, // load more entries for better search coverage
    0,
    undefined,
    undefined,
  );

  // Search entries when search is active
  const { data: searchData, isPlaceholderData } = useJournalSearch(
    debouncedSearch || undefined,
    undefined,
    undefined,
    10,
  );

  // Determine which data to show
  // Strategy: Only use API search results if they actually found something.
  // If API returns empty, fall back to recent entries and let cmdk filter client-side.
  // This ensures we always show relevant results (Thursday matches "th" via cmdk filter).
  const entries = useMemo(() => {
    if (debouncedSearch) {
      // Only use API search results if they found something AND are not stale placeholder data
      if (searchData?.entries && searchData.entries.length > 0 && !isPlaceholderData) {
        return searchData.entries;
      }
      // API returned empty or still loading - fall back to recent entries
      // cmdk will filter these client-side based on the search term
      return recentData?.entries || [];
    }
    return recentData?.entries || [];
  }, [debouncedSearch, searchData?.entries, recentData?.entries, isPlaceholderData]);

  // Track whether we're showing API search results vs client-filtered recent entries
  const isShowingSearchResults = debouncedSearch && searchData?.entries && searchData.entries.length > 0 && !isPlaceholderData;

  const handleSelect = useCallback((entry: JournalEntry) => {
    router.push(`/journal/${entry.entry_date}`);
    onOpenChange(false);
    setSearch("");
  }, [router, onOpenChange]);

  const handleExportData = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/user/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `nova-export.${format}`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Data exported as ${format.toUpperCase()}`);
      onOpenChange(false);
      setSearch("");
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Navigation actions
  const navigationActions = [
    {
      icon: Home,
      label: "Go to Dashboard",
      shortcut: "G D",
      action: () => {
        router.push("/dashboard");
        onOpenChange(false);
        setSearch("");
      },
    },
    {
      icon: PenLine,
      label: "Today's Journal Entry",
      shortcut: "G T",
      action: () => {
        router.push("/journal/today");
        onOpenChange(false);
        setSearch("");
      },
    },
    {
      icon: History,
      label: "Journal History",
      shortcut: "G J",
      action: () => {
        router.push("/journal");
        onOpenChange(false);
        setSearch("");
      },
    },
    {
      icon: MessageCircle,
      label: "Chat with Nova",
      shortcut: "G N",
      action: () => {
        router.push("/nova");
        onOpenChange(false);
        setSearch("");
      },
    },
    {
      icon: ChartBar,
      label: "Weekly Insights",
      shortcut: "G I",
      action: () => {
        router.push("/insights");
        onOpenChange(false);
        setSearch("");
      },
    },
  ];

  // Quick actions
  const quickActions = [
    {
      icon: Plus,
      label: "New Journal Entry",
      action: () => {
        const today = format(new Date(), "yyyy-MM-dd");
        router.push(`/journal/${today}`);
        onOpenChange(false);
        setSearch("");
      },
    },
    {
      icon: Calendar,
      label: "Pick a Date",
      action: () => {
        router.push("/journal");
        onOpenChange(false);
        setSearch("");
      },
    },
    {
      icon: Brain,
      label: "Get AI Prompt",
      action: () => {
        router.push("/journal/today");
        toast.info("Opening today's entry with AI prompt");
        onOpenChange(false);
        setSearch("");
      },
    },
  ];

  const handleThemeSelection = (preference: ThemePreference) => {
    setThemePreference(preference);

    const message =
      preference === "time"
        ? "Time-based theming enabled"
        : preference === "system"
          ? "System theme enabled"
          : `Switched to ${preference} theme`;

    toast.success(message);
    onOpenChange(false);
    setSearch("");
  };

  const themeActions = [
    { icon: Sun, label: "Use Light Theme", preference: "light" as ThemePreference },
    { icon: Sunset, label: "Use Sunset Theme", preference: "sunset" as ThemePreference },
    { icon: Moon, label: "Use Dark Theme", preference: "dark" as ThemePreference },
    { icon: Clock3, label: "Time-of-Day Theme", preference: "time" as ThemePreference },
    { icon: Monitor, label: "Use System Theme", preference: "system" as ThemePreference },
  ].map((action) => ({
    icon: action.icon,
    label: `${action.label}${themePreference === action.preference ? " (Current)" : ""}`,
    action: () => handleThemeSelection(action.preference),
  }));

  // Settings actions
  const settingsActions = [
    ...themeActions,
    {
      icon: User,
      label: "Profile Settings",
      action: () => {
        router.push("/profile");
        onOpenChange(false);
        setSearch("");
      },
    },
    {
      icon: FileJson,
      label: "Export Data as JSON",
      action: () => handleExportData('json'),
    },
    {
      icon: FileText,
      label: "Export Data as CSV",
      action: () => handleExportData('csv'),
    },
  ];

  // Filter commands based on search
  const filteredNavigationActions = navigationActions.filter(action =>
    action.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQuickActions = quickActions.filter(action =>
    action.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSettingsActions = settingsActions.filter(action =>
    action.label.toLowerCase().includes(search.toLowerCase())
  );


  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
    }
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search or type a command..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center py-14 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              No results found.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try searching for journal entries, pages, or commands
            </p>
          </div>
        </CommandEmpty>

        {/* Navigation */}
        {filteredNavigationActions.length > 0 && (
          <>
            <CommandGroup heading="Navigation">
              {filteredNavigationActions.map((action) => (
                <CommandItem
                  key={action.label}
                  onSelect={action.action}
                  className="cursor-pointer"
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  <span className="flex-1">{action.label}</span>
                  {action.shortcut && (
                    <kbd className="ml-auto text-xs text-muted-foreground">
                      {action.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Quick Actions */}
        {filteredQuickActions.length > 0 && (
          <>
            <CommandGroup heading="Quick Actions">
              {filteredQuickActions.map((action) => (
                <CommandItem
                  key={action.label}
                  onSelect={action.action}
                  className="cursor-pointer"
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  <span>{action.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Recent Journal Entries (shown when not searching or while search is loading) */}
        {!isShowingSearchResults && entries.length > 0 && (
          <>
            <CommandGroup heading="Recent Entries">
              {entries.map((entry: JournalEntry) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  searchTerm={debouncedSearch}
                  onSelect={() => handleSelect(entry)}
                />
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Search Results (shown only when search data has loaded) */}
        {isShowingSearchResults && entries.length > 0 && (
          <>
            <CommandGroup heading="Journal Entries">
              {entries.map((entry: JournalEntry) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  searchTerm={debouncedSearch}
                  onSelect={() => handleSelect(entry)}
                />
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Settings & Account */}
        {filteredSettingsActions.length > 0 && (
          <CommandGroup heading="Settings & Account">
            {filteredSettingsActions.map((action) => (
              <CommandItem
                key={action.label}
                onSelect={action.action}
                className="cursor-pointer"
                disabled={isExporting && action.label.includes("Export")}
              >
                <action.icon className="mr-2 h-4 w-4" />
                <span>{action.label}</span>
                {isExporting && action.label.includes("Export") && (
                  <Skeleton className="ml-auto h-4 w-12" />
                )}
              </CommandItem>
            ))}
            <CommandItem
              onSelect={() => {
                onOpenChange(false);
                setSearch("");
              }}
              className="cursor-pointer text-red-600 dark:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <SignOutButton>Sign Out</SignOutButton>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

interface EntryItemProps {
  entry: JournalEntry;
  searchTerm?: string;
  onSelect: () => void;
}

function EntryItem({ entry, searchTerm, onSelect }: EntryItemProps) {
  const MoodIcon = entry.mood ? moodIcons[entry.mood as Mood] : null;

  // Explicit value for cmdk filtering - include all searchable text
  const searchableValue = [
    format(parseISO(entry.entry_date), "EEEE"),    // "Thursday"
    format(parseISO(entry.entry_date), "MMMM"),    // "November"
    format(parseISO(entry.entry_date), "dd"),      // "21"
    format(parseISO(entry.entry_date), "yyyy"),    // "2024"
    entry.freeform_text?.substring(0, 200) || "",  // Entry content
  ].join(" ");

  return (
    <CommandItem
      value={searchableValue}
      onSelect={onSelect}
      className="cursor-pointer group transition-all"
    >
      <div className="flex items-start gap-3 w-full">
        {/* Date */}
        <div className="flex flex-col items-center min-w-[48px]">
          <div className="text-sm font-medium">
            {format(parseISO(entry.entry_date), "dd")}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(parseISO(entry.entry_date), "MMM")}
          </div>
          {MoodIcon && <MoodIcon className="h-4 w-4 mt-1" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">
              {format(parseISO(entry.entry_date), "EEEE")}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(parseISO(entry.entry_date), {
                addSuffix: true,
              })}
            </span>
            {entry.word_count && entry.word_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {entry.word_count} words
              </Badge>
            )}
          </div>

          {/* Entry preview/snippet */}
          {entry.freeform_text && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {searchTerm
                ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightText(
                        getSearchSnippet(entry.freeform_text, searchTerm, 100),
                        searchTerm,
                      ),
                    }}
                  />
                )
                : (
                  entry.freeform_text.substring(0, 100) +
                  (entry.freeform_text.length > 100 ? "..." : "")
                )}
            </p>
          )}
        </div>

        {/* Arrow indicator on hover */}
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </CommandItem>
  );
}