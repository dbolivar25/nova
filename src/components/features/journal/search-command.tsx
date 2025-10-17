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
  ChevronRight,
  Cloud,
  FileText,
  Frown,
  Heart,
  Meh,
  Search,
  Smile,
  Sun,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useJournalEntries, useJournalSearch } from "@/features/journal/hooks/use-journal";
import { getSearchSnippet, highlightText } from "@/shared/lib/utils/highlight";
import { cn } from "@/shared/lib/utils";
import type { JournalEntry, Mood } from "@/features/journal/types/journal";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const moodIcons: Record<Mood, React.ComponentType<{ className?: string }>> = {
  positive: Smile,
  negative: Frown,
  neutral: Meh,
  thoughtful: Brain,
  grateful: Heart,
  anxious: Cloud,
  excited: Zap,
  sad: Frown,
  angry: Frown,
  peaceful: Sun,
};

const moodColors: Record<Mood, string> = {
  positive: "text-green-600 dark:text-green-400",
  negative: "text-red-600 dark:text-red-400",
  neutral: "text-gray-600 dark:text-gray-400",
  thoughtful: "text-blue-600 dark:text-blue-400",
  grateful: "text-purple-600 dark:text-purple-400",
  anxious: "text-orange-600 dark:text-orange-400",
  excited: "text-yellow-600 dark:text-yellow-400",
  sad: "text-indigo-600 dark:text-indigo-400",
  angry: "text-red-700 dark:text-red-300",
  peaceful: "text-teal-600 dark:text-teal-400",
};

function buildEntrySearchValue(entry: JournalEntry): string {
  const entryDate = parseISO(entry.entry_date);
  const hasValidDate = !Number.isNaN(entryDate.getTime());
  const promptContent = entry.prompt_responses
    ?.map((response) =>
      [response.prompt?.prompt_text, response.response_text]
        .filter(Boolean)
        .join(" "),
    )
    .join(" ") ?? "";

  const dateParts = hasValidDate
    ? [
        format(entryDate, "yyyy-MM-dd"),
        format(entryDate, "MMMM d, yyyy"),
        format(entryDate, "MMMM d"),
        format(entryDate, "MMM d"),
        format(entryDate, "MMMM"),
        format(entryDate, "MMM"),
        format(entryDate, "EEEE"),
        format(entryDate, "EEE"),
        entry.entry_date,
      ]
    : [entry.entry_date];

  return [
    ...dateParts,
    entry.mood ?? "",
    entry.freeform_text ?? "",
    promptContent,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood | undefined>();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch recent entries when no search
  const { data: recentData, isLoading: isLoadingRecent } = useJournalEntries(
    10, // limit to 10 recent entries
    0,
    undefined,
    undefined,
  );

  // Search entries when search is active
  const { data: searchData, isLoading: isSearching } = useJournalSearch(
    debouncedSearch || undefined,
    selectedMood,
    undefined,
    50,
  );

  const normalizedSearch = search.trim().toLowerCase();

  const matchesMood = useCallback(
    (entry: JournalEntry) => !selectedMood || entry.mood === selectedMood,
    [selectedMood],
  );

  const matchesSearch = useCallback(
    (entry: JournalEntry) => {
      if (!normalizedSearch) {
        return true;
      }

      return buildEntrySearchValue(entry).includes(normalizedSearch);
    },
    [normalizedSearch],
  );

  const filteredRecentEntries = useMemo(
    () =>
      (recentData?.entries ?? []).filter(
        (entry) => matchesMood(entry) && matchesSearch(entry),
      ),
    [recentData?.entries, matchesMood, matchesSearch],
  );

  const filteredSearchEntries = useMemo(
    () =>
      (searchData?.entries ?? []).filter(
        (entry) => matchesMood(entry) && matchesSearch(entry),
      ),
    [searchData?.entries, matchesMood, matchesSearch],
  );

  const entries = useMemo(() => {
    if (debouncedSearch || selectedMood) {
      const merged = new Map<string, JournalEntry>();

      filteredSearchEntries.forEach((entry) => {
        merged.set(entry.id, entry);
      });

      filteredRecentEntries.forEach((entry) => {
        if (!merged.has(entry.id)) {
          merged.set(entry.id, entry);
        }
      });

      return Array.from(merged.values());
    }

    return filteredRecentEntries;
  }, [
    debouncedSearch,
    selectedMood,
    filteredSearchEntries,
    filteredRecentEntries,
  ]);

  const isLoading = debouncedSearch || selectedMood ? isSearching : isLoadingRecent;

  // Group entries by time period
  const groupedEntries = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const groups: Record<string, JournalEntry[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    };

    entries.forEach((entry: JournalEntry) => {
      const entryDate = parseISO(entry.entry_date);
      if (format(entryDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
        groups.today.push(entry);
      } else if (
        format(entryDate, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")
      ) {
        groups.yesterday.push(entry);
      } else if (entryDate > thisWeek) {
        groups.thisWeek.push(entry);
      } else if (entryDate > thisMonth) {
        groups.thisMonth.push(entry);
      } else {
        groups.older.push(entry);
      }
    });

    return groups;
  }, [entries]);

  const handleSelect = useCallback((entry: JournalEntry) => {
    router.push(`/journal/${entry.entry_date}`);
    onOpenChange(false);
  }, [router, onOpenChange]);

  const handleMoodFilter = useCallback((mood: Mood) => {
    setSelectedMood(mood === selectedMood ? undefined : mood);
  }, [selectedMood]);

  // Quick actions
  const quickActions = [
    {
      icon: FileText,
      label: "Today's Entry",
      action: () => {
        router.push("/journal/today");
        onOpenChange(false);
      },
    },
    {
      icon: Calendar,
      label: "Browse Calendar",
      action: () => {
        router.push("/journal");
        onOpenChange(false);
      },
    },
    {
      icon: TrendingUp,
      label: "View Analytics",
      action: () => {
        router.push("/analytics");
        onOpenChange(false);
      },
    },
  ];

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      commandProps={{ shouldFilter: false }}
    >
      <CommandInput
        placeholder="Search your journal entries..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center py-14 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              No entries found matching your search.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try different keywords or filters
            </p>
          </div>
        </CommandEmpty>

        {/* Quick Actions - Always visible */}
        {!debouncedSearch && (
          <>
            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => (
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

        {/* Mood Filters */}
        {!debouncedSearch && (
          <>
            <CommandGroup heading="Filter by Mood">
              <div className="grid grid-cols-5 gap-2 p-2">
                {(Object.keys(moodIcons) as Mood[]).slice(0, 5).map((mood) => {
                  const Icon = moodIcons[mood];
                  return (
                    <button
                      key={mood}
                      onClick={() => handleMoodFilter(mood)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                        "hover:bg-accent hover:scale-105",
                        selectedMood === mood &&
                          "bg-accent ring-2 ring-primary",
                      )}
                    >
                      <Icon className={cn("h-5 w-5", moodColors[mood])} />
                      <span className="text-xs capitalize">{mood}</span>
                    </button>
                  );
                })}
              </div>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Search Results */}
        {isLoading && entries.length === 0
          ? (
            <CommandGroup heading="Loading...">
              <div className="space-y-2 p-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            </CommandGroup>
          )
          : (
            <>
              {/* Today's Entries */}
              {groupedEntries.today.length > 0 && (
                <>
                  <CommandGroup heading="Today">
                    {groupedEntries.today.map((entry) => (
                      <EntryItem
                        key={entry.id}
                        entry={entry}
                        searchTerm={search}
                        onSelect={() => handleSelect(entry)}
                        isSelected={selectedEntry?.id === entry.id}
                        onHover={() => setSelectedEntry(entry)}
                      />
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Yesterday's Entries */}
              {groupedEntries.yesterday.length > 0 && (
                <>
                  <CommandGroup heading="Yesterday">
                    {groupedEntries.yesterday.map((entry) => (
                      <EntryItem
                        key={entry.id}
                        entry={entry}
                        searchTerm={search}
                        onSelect={() => handleSelect(entry)}
                        isSelected={selectedEntry?.id === entry.id}
                        onHover={() => setSelectedEntry(entry)}
                      />
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* This Week */}
              {groupedEntries.thisWeek.length > 0 && (
                <>
                  <CommandGroup heading="This Week">
                    {groupedEntries.thisWeek.map((entry) => (
                      <EntryItem
                        key={entry.id}
                        entry={entry}
                        searchTerm={search}
                        onSelect={() => handleSelect(entry)}
                        isSelected={selectedEntry?.id === entry.id}
                        onHover={() => setSelectedEntry(entry)}
                      />
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* This Month */}
              {groupedEntries.thisMonth.length > 0 && (
                <>
                  <CommandGroup heading="This Month">
                    {groupedEntries.thisMonth.map((entry) => (
                      <EntryItem
                        key={entry.id}
                        entry={entry}
                        searchTerm={search}
                        onSelect={() => handleSelect(entry)}
                        isSelected={selectedEntry?.id === entry.id}
                        onHover={() => setSelectedEntry(entry)}
                      />
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Older Entries */}
              {groupedEntries.older.length > 0 && (
                <CommandGroup heading="Older">
                  {groupedEntries.older.map((entry) => (
                    <EntryItem
                      key={entry.id}
                      entry={entry}
                      searchTerm={search}
                      onSelect={() => handleSelect(entry)}
                      isSelected={selectedEntry?.id === entry.id}
                      onHover={() => setSelectedEntry(entry)}
                    />
                  ))}
                </CommandGroup>
              )}
            </>
          )}

        {/* Results Summary */}
        {(debouncedSearch || selectedMood) && entries.length > 0 && (
          <div className="flex items-center justify-center py-2 text-xs text-muted-foreground border-t">
            <span>
              {entries.length} {entries.length === 1 ? "entry" : "entries"}{" "}
              found
              {selectedMood && ` with ${selectedMood} mood`}
            </span>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}

interface EntryItemProps {
  entry: JournalEntry;
  searchTerm?: string;
  onSelect: () => void;
  isSelected?: boolean;
  onHover?: () => void;
}

function EntryItem(
  { entry, searchTerm, onSelect, isSelected, onHover }: EntryItemProps,
) {
  const MoodIcon = entry.mood ? moodIcons[entry.mood as Mood] : null;
  const moodColor = entry.mood ? moodColors[entry.mood as Mood] : "";
  const entryDate = parseISO(entry.entry_date);
  const commandItemValue = buildEntrySearchValue(entry);

  return (
    <CommandItem
      value={commandItemValue}
      onSelect={onSelect}
      onMouseEnter={onHover}
      className={cn(
        "cursor-pointer group transition-all",
        isSelected && "bg-accent",
      )}
    >
      <div className="flex items-start gap-3 w-full">
        {/* Date & Mood Icon */}
        <div className="flex flex-col items-center min-w-[48px]">
          <div className="text-sm font-medium">
            {format(entryDate, "dd")}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(entryDate, "MMM")}
          </div>
          {MoodIcon && <MoodIcon className={cn("h-4 w-4 mt-1", moodColor)} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">
              {format(entryDate, "EEEE")}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(entryDate, {
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
                ? highlightText(
                  getSearchSnippet(entry.freeform_text, searchTerm, 150),
                  searchTerm,
                )
                : entry.freeform_text.substring(0, 150) +
                  (entry.freeform_text.length > 150 ? "..." : "")}
            </p>
          )}
        </div>

        {/* Arrow indicator on hover */}
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </CommandItem>
  );
}

