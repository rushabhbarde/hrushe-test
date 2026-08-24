export function buildBackendUnavailableResponseBody(environment = process.env.NODE_ENV) {
  if (environment === "development") {
    return {
      message:
        "Backend API is unavailable. Start the backend server on http://localhost:5001 and try again.",
    };
  }

  return {
    message: "HRUSHE services are temporarily unavailable. Please try again shortly.",
  };
}
