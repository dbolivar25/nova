import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { useJournalEntries, useTodaysPrompts, useTodaysJournalEntry } from '../use-journal'
import * as journalApi from '@/lib/api/journal'

// Mock the journal API
vi.mock('@/lib/api/journal', () => ({
  getJournalEntries: vi.fn(),
  getJournalEntryByDate: vi.fn(),
  createJournalEntry: vi.fn(),
  getTodaysPrompts: vi.fn(),
  calculateWordCount: vi.fn(),
}))

// Wrapper to provide SWR context
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(SWRConfig, {
    value: { dedupingInterval: 0, provider: () => new Map() },
    children,
  })
}

describe('Journal Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useJournalEntries', () => {
    it('should fetch journal entries', async () => {
      const mockData = { entries: [{ id: '1' }], total: 1 }
      vi.mocked(journalApi.getJournalEntries).mockResolvedValue(mockData)

      const { result } = renderHook(() => useJournalEntries(), { wrapper })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
        expect(result.current.isLoading).toBe(false)
      })

      expect(journalApi.getJournalEntries).toHaveBeenCalledWith(undefined, undefined, undefined, undefined)
    })

    it('should handle pagination', async () => {
      const mockData = { entries: [], total: 0 }
      vi.mocked(journalApi.getJournalEntries).mockResolvedValue(mockData)

      const { result } = renderHook(() => useJournalEntries(10, 20), { wrapper })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })

      expect(journalApi.getJournalEntries).toHaveBeenCalledWith(10, 20, undefined, undefined)
    })
  })

  describe('useTodaysPrompts', () => {
    it('should fetch today\'s prompts', async () => {
      const mockPrompts = [
        { id: '1', prompt_text: 'Prompt 1' },
        { id: '2', prompt_text: 'Prompt 2' }
      ]
      vi.mocked(journalApi.getTodaysPrompts).mockResolvedValue(mockPrompts)

      const { result } = renderHook(() => useTodaysPrompts(), { wrapper })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPrompts)
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('useTodaysJournalEntry', () => {
    it('should fetch today\'s entry if it exists', async () => {
      const mockEntry = { id: '1', entry_date: '2024-01-01' }
      vi.mocked(journalApi.getJournalEntryByDate).mockResolvedValue(mockEntry)

      const { result } = renderHook(() => useTodaysJournalEntry(), { wrapper })

      await waitFor(() => {
        expect(result.current.entry).toEqual(mockEntry)
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should provide function to create entry if none exists', async () => {
      vi.mocked(journalApi.getJournalEntryByDate).mockResolvedValue(null)
      const newEntry = { id: '1', entry_date: '2024-01-01' }
      vi.mocked(journalApi.createJournalEntry).mockResolvedValue(newEntry)

      const { result } = renderHook(() => useTodaysJournalEntry(), { wrapper })

      await waitFor(() => {
        expect(result.current.entry).toBeNull()
      })

      let createdEntry
      await waitFor(async () => {
        createdEntry = await result.current.getOrCreateEntry()
      })
      
      expect(createdEntry).toEqual(newEntry)
    })
  })
})