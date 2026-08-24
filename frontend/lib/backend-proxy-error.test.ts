import { describe, expect, it } from "vitest";
import { buildBackendUnavailableResponseBody } from "@/lib/backend-proxy-error";

describe("backend proxy unavailable response", () => {
  it("keeps local setup guidance in development", () => {
    expect(buildBackendUnavailableResponseBody("development").message).toContain("localhost:5001");
  });

  it("hides local backend details outside development", () => {
    const message = buildBackendUnavailableResponseBody("production").message;

    expect(message).toContain("temporarily unavailable");
    expect(message).not.toContain("localhost");
    expect(message).not.toContain("5001");
  });
});
