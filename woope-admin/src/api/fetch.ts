export async function fetchAPI(
endpoint: string,
method: string = "GET",
body: any = null
) {
// Retrieve JWT token from localStorage (if user is logged in)
const token = localStorage.getItem("token");

// Build request config
const config: RequestInit = {
method,
headers: {
"Content-Type": "application/json",
    // Attach Authorization header only if token exists
"Authorization": token ? `Bearer ${token}` : ""
}
};

// Attach request body if provided (for POST/PUT)
if (body) {
config.body = JSON.stringify(body);
}

// Send request to backend API
const response = await fetch(
`${import.meta.env.VITE_API_URL}${endpoint}`,
config
);

// Handle non-2xx responses (errors)
if (!response.ok) {
const textResponse = await response.text();

try {
    // Try parsing error as JSON
    const errorResponse = JSON.parse(textResponse);
    throw new Error(errorResponse.error || response.statusText);
} catch {
    // Fallback if response is not valid JSON
    throw new Error(textResponse || "The server returned an unexpected response.");
}
}

// Handle 204 No Content (e.g., DELETE success)
if (response.status === 204) {
return null;
}

// Read response as text first (safer than directly calling .json())
const textResponse = await response.text();

// If response body is empty, return null instead of crashing
if (!textResponse) {
return null;
}

try {
// Parse JSON response
return JSON.parse(textResponse);
} catch {
// If parsing fails, surface a clear error
throw new Error("The server returned an unexpected response.");
}
}