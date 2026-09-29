import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { policyTabs } from "@/lib/policies";

describe("policies used by the help assistant", () => {
  it("backend copy matches the website's policies", () => {
    const backendCopy = JSON.parse(readFileSync(join(__dirname, "../../backend/src/data/policies.json"), "utf8"));
    expect(backendCopy).toEqual(JSON.parse(JSON.stringify(policyTabs)));
  });
});
