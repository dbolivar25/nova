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
  Moon,
  PenLine,
  Plus,
  Search,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { useJournalEntries, useJournalSearch } from "@/features/journal/hooks/use-journal";
import { getSearchSnippet, highlightText } from "@/shared/lib/utils/highlight";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { SignOutButton } from "@clerk/nextjs";
import type { JournalEntry, Mood } from "@/features/journal/types/journal";

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
  const { theme, setTheme } = useTheme();
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
  const { data: recentData } = useJournalEntries(
    5, // limit to 5 recent entries for command palette
    0,
    undefined,
    undefined,
  );

  // Search entries when search is active
  const { data: searchData } = useJournalSearch(
    debouncedSearch || undefined,
    undefined,
    undefined,
    10,
  );

  // Determine which data to show
  const entries = useMemo(() => {
    if (debouncedSearch) {
      return searchData?.entries || [];
    }
    return recentData?.entries || [];
  }, [debouncedSearch, searchData?.entries, recentData?.entries]);


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
      icon: Sparkles,
      label: "Chat with Nova AI",
      shortcut: "G N",
      action: () => {
        router.push("/nova");
        onOpenChange(false);
        setSearch("");
      },
    },
    {
      icon: ChartBar,
      label: "Open Pulse",
      shortcut: "G P",
      action: () => {
        router.push("/analytics");
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

  // Settings actions
  const settingsActions = [
    {
      icon: theme === "dark" ? Sun : Moon,
      label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        toast.success(`Switched to ${theme === "dark" ? "light" : "dark"} mode`);
        onOpenChange(false);
        setSearch("");
      },
    },
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

        {/* Recent Journal Entries */}
        {!debouncedSearch && entries.length > 0 && (
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

        {/* Search Results */}
        {debouncedSearch && entries.length > 0 && (
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

  return (
    <CommandItem
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
