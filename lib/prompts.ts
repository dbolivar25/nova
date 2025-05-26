export const journalPrompts = [
  // Self-Awareness
  "What emotion did you try to avoid today, and why?",
  "When did you feel most authentic today?",
  "What part of yourself did you hide or suppress today?",
  "What triggered the strongest emotional response in you today?",
  "How did your body feel at different points throughout the day?",
  
  // Growth & Purpose
  "What challenged your assumptions today?",
  "What small step did you take toward a larger goal?",
  "What failure or setback taught you something valuable today?",
  "How did you grow as a person today, even in a small way?",
  "What would you do differently if you could relive today?",
  
  // Relationships
  "How did you show up for someone today?",
  "What boundary did you set or wish you had set?",
  "Who made a positive impact on your day and how?",
  "What unspoken tension exists in one of your relationships?",
  "How did you contribute to someone else's happiness today?",
  
  // Gratitude & Presence
  "What subtle beauty did you notice today?",
  "What ordinary moment felt extraordinary?",
  "What are you taking for granted that you'd miss if it were gone?",
  "What simple pleasure brought you unexpected joy?",
  "When did you feel most present and alive today?"
]

export function getRandomPrompts(count: number = 3): string[] {
  const shuffled = [...journalPrompts].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}