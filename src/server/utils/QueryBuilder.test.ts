import { describe, it, expect } from "vitest";
import { QueryBuilder } from "./QueryBuilder";

describe("QueryBuilder", () => {
  it("should build pagination correctly", () => {
    const page1 = QueryBuilder.buildPagination(1, 10);
    expect(page1).toEqual({ skip: 0, take: 10 });

    const page2 = QueryBuilder.buildPagination(2, 25);
    expect(page2).toEqual({ skip: 25, take: 25 });
  });

  it("should build sort correctly", () => {
    const sort = QueryBuilder.buildSort("name", "asc");
    expect(sort).toEqual({ name: "asc" });

    const defaultSort = QueryBuilder.buildSort();
    expect(defaultSort).toEqual({ createdAt: "desc" });
  });
});
