import { toast } from "sonner";

type RequestOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
};

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", headers = {}, body } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`/api${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || "An error occurred",
        response.status,
        data.code
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      "Network error. Please check your connection.",
      0,
      "NETWORK_ERROR"
    );
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        toast.error("Please sign in to continue");
        break;
      case 403:
        toast.error("You don't have permission to do that");
        break;
      case 404:
        toast.error("Not found");
        break;
      case 500:
        toast.error("Something went wrong. Please try again later.");
        break;
      default:
        toast.error(error.message);
    }
  } else {
    toast.error("An unexpected error occurred");
  }
  
  console.error("API Error:", error);
}

// SWR fetcher function
export const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new APIError(
      `An error occurred while fetching the data.`,
      res.status
    );
  }
  return res.json();
});