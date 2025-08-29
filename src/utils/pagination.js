export function buildPagination({ page = 1, limit = 10 }) {
    const take = Math.max(1, Math.min(100, Number(limit) || 10));
    const current = Math.max(1, Number(page) || 1);
    const skip = (current - 1) * take;
    return { take, skip, current };
  }
  