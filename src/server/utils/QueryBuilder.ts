export class QueryBuilder {
  static buildPagination(page: number = 1, limit: number = 10) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    return {
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    };
  }

  static buildSort(sortBy?: string, sortOrder: "asc" | "desc" = "desc") {
    if (!sortBy) return { createdAt: "desc" };
    return { [sortBy]: sortOrder };
  }

  static buildSearch(fields: string[], query?: string) {
    if (!query) return {};
    
    return {
      OR: fields.map((field) => ({
        [field]: {
          contains: query,
          mode: "insensitive",
        },
      })),
    };
  }
}
