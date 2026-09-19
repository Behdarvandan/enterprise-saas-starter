import { describe, expect, it } from "vitest";
import { asLeadCategory, asLeadStatus, asProjectStage, asWorkingMode } from "./enums";

describe("admin enum guards", () => {
  it("accept known values and reject everything else", () => {
    expect(asLeadStatus("quoted")).toBe("quoted");
    expect(asLeadCategory("ai_automation")).toBe("ai_automation");
    expect(asWorkingMode("hourly")).toBe("hourly");
    expect(asProjectStage("live")).toBe("live");

    for (const guard of [asLeadStatus, asLeadCategory, asWorkingMode, asProjectStage]) {
      expect(guard("bogus")).toBeNull();
      expect(guard(null)).toBeNull();
      expect(guard(undefined)).toBeNull();
    }
  });
});
