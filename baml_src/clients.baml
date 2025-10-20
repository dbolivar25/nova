// LLM Client Definitions for Nova

// Fast conversational model for chat
client<llm> GPT5Mini {
  provider openai
  retry_policy Exponential
  options {
    model "gpt-5-mini"
    api_key env.OPENAI_API_KEY
  }
}

// High-quality model for deep analysis
client<llm> GPT5 {
  provider openai
  retry_policy Exponential
  options {
    model "gpt-5"
    api_key env.OPENAI_API_KEY
  }
}

// Nano for lightweight tasks
client<llm> GPT5Nano {
  provider openai
  retry_policy Exponential
  options {
    model "gpt-5-nano"
    api_key env.OPENAI_API_KEY
  }
}

client<llm> GroqGPT20BLow {
  provider openai-generic
  options {
    base_url "https://api.groq.com/openai/v1"
    api_key env.GROQ_API_KEY
    model "openai/gpt-oss-20b"
    reasoning_effort "low"
  }
}

client<llm> GroqGPT120B {
  provider openai-generic
  options {
    base_url "https://api.groq.com/openai/v1"
    api_key env.GROQ_API_KEY
    model "openai/gpt-oss-120b"
  }
}

// Retry policies
retry_policy Exponential {
  max_retries 3
  strategy {
    type exponential_backoff
    delay_ms 300
    multiplier 1.5
    max_delay_ms 10000
  }
}

retry_policy LongExponential {
  max_retries 3
  strategy {
    type exponential_backoff
    delay_ms 1000
    multiplier 2
    max_delay_ms 100000
  }
}
