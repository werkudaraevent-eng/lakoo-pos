export function buildSalesWorkspaceSummary({ filteredSales = [], page = 1, totalPages = 1 } = {}) {
  return {
    matchedCount: filteredSales.length,
    matchedRevenue: filteredSales.reduce((sum, sale) => sum + Number(sale.grandTotal || 0), 0),
    pageLabel: `${page} / ${totalPages}`,
  };
}
