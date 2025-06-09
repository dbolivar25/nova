import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedPrompts() {
  try {
    console.log("Reading seed SQL file...");
    const sqlPath = path.join(process.cwd(), "supabase", "seed-prompts.sql");
    const sql = await fs.readFile(sqlPath, "utf-8");
    
    console.log("Seeding journal prompts...");
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });
    
    if (error) {
      console.error("Error seeding prompts:", error);
      
      // Fallback: Try inserting directly
      console.log("Trying direct insert...");
      const prompts = [
        // Self-Reflection
        { prompt_text: "What moment from today would you want to relive, and why?", category: "self-reflection", is_active: true },
        { prompt_text: "What challenged you today, and how did you respond to it?", category: "self-reflection", is_active: true },
        { prompt_text: "If today had a theme song, what would it be and why?", category: "self-reflection", is_active: true },
        { prompt_text: "What did you learn about yourself today?", category: "self-reflection", is_active: true },
        { prompt_text: "What would you tell your morning self, knowing what you know now?", category: "self-reflection", is_active: true },
        // Gratitude
        { prompt_text: "What three things are you grateful for today?", category: "gratitude", is_active: true },
        { prompt_text: "Who made a positive impact on your day, even in a small way?", category: "gratitude", is_active: true },
        { prompt_text: "What simple pleasure did you enjoy today?", category: "gratitude", is_active: true },
        { prompt_text: "What aspect of your health or body are you thankful for today?", category: "gratitude", is_active: true },
        // Growth & Goals
        { prompt_text: "What progress did you make toward your goals today, however small?", category: "growth", is_active: true },
        { prompt_text: "What habit are you building, and how did it go today?", category: "growth", is_active: true },
        { prompt_text: "What would make tomorrow even better than today?", category: "growth", is_active: true },
        { prompt_text: "What skill did you practice or improve today?", category: "growth", is_active: true },
        // Emotions & Mindfulness
        { prompt_text: "How would you describe your emotional weather today?", category: "emotions", is_active: true },
        { prompt_text: "What emotion visited you today that surprised you?", category: "emotions", is_active: true },
        { prompt_text: "When did you feel most like yourself today?", category: "emotions", is_active: true },
        { prompt_text: "What thoughts have been occupying your mind lately?", category: "emotions", is_active: true },
        // Relationships
        { prompt_text: "How did you connect with someone meaningful today?", category: "relationships", is_active: true },
        { prompt_text: "What relationship in your life deserves more attention?", category: "relationships", is_active: true },
        { prompt_text: "How did you show love or kindness today?", category: "relationships", is_active: true },
        // Creativity & Dreams
        { prompt_text: "What inspired you today?", category: "creativity", is_active: true },
        { prompt_text: "If you could change one thing about today, what would it be?", category: "creativity", is_active: true },
        { prompt_text: "What dream or aspiration feels especially alive right now?", category: "creativity", is_active: true },
        // Life Perspective
        { prompt_text: "What would you like to remember about this phase of your life?", category: "perspective", is_active: true },
        { prompt_text: "How are you different from who you were a year ago?", category: "perspective", is_active: true },
        { prompt_text: "What advice would you give to someone experiencing what you experienced today?", category: "perspective", is_active: true },
      ];
      
      const { error: insertError } = await supabase
        .from("journal_prompts")
        .insert(prompts);
      
      if (insertError) {
        console.error("Error inserting prompts:", insertError);
        process.exit(1);
      }
    }
    
    console.log("✅ Successfully seeded journal prompts!");
    
    // Verify the prompts were inserted
    const { data, count } = await supabase
      .from("journal_prompts")
      .select("*", { count: "exact" });
    
    console.log(`Total prompts in database: ${count}`);
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

seedPrompts();