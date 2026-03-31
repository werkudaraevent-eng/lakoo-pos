export function filterSales(sales, { query = "", paymentMethod = "all" } = {}) {
  const keyword = query.trim().toLowerCase();

  return sales.filter((sale) => {
    const matchesPayment = paymentMethod === "all" || sale.paymentMethod === paymentMethod;

    if (!matchesPayment) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const itemSearch = sale.items
      .map((item) => `${item.productNameSnapshot} ${item.skuSnapshot}`)
      .join(" ")
      .toLowerCase();
    const haystack = `${sale.receiptNumber} ${sale.cashierUser} ${itemSearch}`.toLowerCase();
    return haystack.includes(keyword);
  });
}

export function paginateSales(sales, { page = 1, pageSize = 6 } = {}) {
  const totalPages = Math.max(1, Math.ceil(sales.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    pageSize,
    totalPages,
    items: sales.slice(start, start + pageSize),
  };
}

export function buildReceiptTitle(sale) {
  return `Receipt ${sale.receiptNumber}`;
}
