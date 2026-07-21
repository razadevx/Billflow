import { describe, it, expect } from "vitest";
import { ok, fail } from "./Result";

describe("Result Pattern", () => {
  it("should create a successful result", () => {
    const result = ok("data");
    expect(result.isSuccess()).toBe(true);
    expect(result.isFailure()).toBe(false);
    if (result.isSuccess()) {
      expect(result.value).toBe("data");
    }
  });

  it("should create a failed result", () => {
    const error = new Error("Something went wrong");
    const result = fail(error);
    expect(result.isSuccess()).toBe(false);
    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error).toBe(error);
    }
  });
});
