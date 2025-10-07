import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getJournalEntries,
  getJournalEntryByDate,
  createJournalEntry,
  updateJournalEntry,
  calculateWordCount,
} from '../journal'
import { apiRequest } from '@/shared/lib/api/client'

// Mock the apiRequest function
vi.mock('@/shared/lib/api/client', () => ({
  apiRequest: vi.fn(),
}))

describe('Journal API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getJournalEntries', () => {
    it('should fetch journal entries with default parameters', async () => {
      const mockEntries = { entries: [], total: 0 }
      vi.mocked(apiRequest).mockResolvedValue(mockEntries)

      const result = await getJournalEntries()
      
      expect(apiRequest).toHaveBeenCalledWith('/journal/entries?')
      expect(result).toEqual(mockEntries)
    })

    it('should fetch journal entries with pagination', async () => {
      const mockEntries = { entries: [], total: 10 }
      vi.mocked(apiRequest).mockResolvedValue(mockEntries)

      const result = await getJournalEntries(5, 10)
      
      expect(apiRequest).toHaveBeenCalledWith('/journal/entries?limit=5&offset=10')
      expect(result).toEqual(mockEntries)
    })
  })

  describe('getJournalEntryByDate', () => {
    it('should fetch entry for specific date', async () => {
      const mockEntry = { entry: { id: '1', entry_date: '2024-01-01' } }
      vi.mocked(apiRequest).mockResolvedValue(mockEntry)

      const result = await getJournalEntryByDate('2024-01-01')
      
      expect(apiRequest).toHaveBeenCalledWith('/journal/entries/2024-01-01')
      expect(result).toEqual(mockEntry.entry)
    })

    it('should return null if no entry found', async () => {
      vi.mocked(apiRequest).mockResolvedValue({ entry: null })

      const result = await getJournalEntryByDate('2024-01-01')
      
      expect(result).toBeNull()
    })
  })

  describe('createJournalEntry', () => {
    it('should create journal entry with proper transformation', async () => {
      const input = {
        entryDate: '2024-01-01',
        freeformText: 'Test entry',
        mood: 'positive' as const,
        promptResponses: [
          { promptId: 'p1', responseText: 'Response 1' }
        ]
      }
      
      const mockEntry = { entry: { id: '1', ...input } }
      vi.mocked(apiRequest).mockResolvedValue(mockEntry)

      const result = await createJournalEntry(input)
      
      expect(apiRequest).toHaveBeenCalledWith('/journal/entries', {
        method: 'POST',
        body: {
          entry_date: '2024-01-01',
          freeform_text: 'Test entry',
          mood: 'positive',
          prompt_responses: [
            { prompt_id: 'p1', response_text: 'Response 1' }
          ]
        }
      })
      expect(result).toEqual(mockEntry.entry)
    })
  })

  describe('updateJournalEntry', () => {
    it('should update journal entry with proper transformation', async () => {
      const input = {
        freeformText: 'Updated entry',
        mood: 'thoughtful' as const,
      }
      
      const mockEntry = { entry: { id: '1', ...input } }
      vi.mocked(apiRequest).mockResolvedValue(mockEntry)

      const result = await updateJournalEntry('2024-01-01', input)
      
      expect(apiRequest).toHaveBeenCalledWith('/journal/entries/2024-01-01', {
        method: 'PUT',
        body: {
          freeform_text: 'Updated entry',
          mood: 'thoughtful',
          prompt_responses: undefined
        }
      })
      expect(result).toEqual(mockEntry.entry)
    })
  })

  describe('calculateWordCount', () => {
    it('should calculate word count correctly', () => {
      expect(calculateWordCount('Hello world')).toBe(2)
      expect(calculateWordCount('  Multiple   spaces  ')).toBe(2)
      expect(calculateWordCount('')).toBe(0)
      expect(calculateWordCount('   ')).toBe(0)
      expect(calculateWordCount('One')).toBe(1)
    })
  })
})