import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { usePosData } from "../context/PosDataContext";
import {
  buildPromotionMetrics,
  buildPromotionRows,
  buildPromotionsCsv,
  filterPromotionRows,
  paginatePromotionRows,
  sortPromotionRows,
} from "../features/promotions/promotionsWorkspace";
import { AppIcon } from "../features/ui/AppIcon";
import { formatCurrency, formatDate } from "../utils/formatters";
import "../features/promotions/promotions.css";

const PAGE_SIZE = 8;

function downloadPromotionsCsv(rows) {
  const csv = buildPromotionsCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "promotions-export.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function formatValidityRange(startAt, endAt) {
  return `${formatDate(startAt)} sampai ${formatDate(endAt)}`;
}

export function PromotionsPage() {
  const { promotions, sales, loading, loadError } = usePosData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("status");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const metrics = useMemo(() => buildPromotionMetrics(promotions, sales), [promotions, sales]);
  const promotionRows = useMemo(() => buildPromotionRows(promotions, sales), [promotions, sales]);
  const filteredRows = useMemo(
    () => filterPromotionRows(promotionRows, { query: deferredQuery, status: statusFilter }),
    [deferredQuery, promotionRows, statusFilter]
  );
  const sortedRows = useMemo(() => sortPromotionRows(filteredRows, sortBy), [filteredRows, sortBy]);
  const paginatedRows = useMemo(
    () => paginatePromotionRows(sortedRows, { page, pageSize: PAGE_SIZE }),
    [page, sortedRows]
  );

  useEffect(() => {
    setPage(1);
  }, [deferredQuery, sortBy, statusFilter]);

  return (
    <div className="promotions-banani-page">
      <div className="page-actions">
        <div className="promotions-banani-actions">
          <Button
            className="promotions-banani-button"
            onClick={() => downloadPromotionsCsv(sortedRows)}
            size="lg"
            type="button"
            variant="outline"
          >
            <AppIcon name="Download" size={16} />
            <span>Export CSV</span>
          </Button>
          <Button asChild className="promotions-banani-button is-primary" size="lg">
            <Link to="/promotions/new">
              <AppIcon name="Plus" size={16} />
              <span>Create Promotion</span>
            </Link>
          </Button>
        </div>
      </div>

      {loading ? <p className="info-text">Loading promotions...</p> : null}
      {loadError ? <p className="error-text">{loadError}</p> : null}

      <section className="promotions-banani-stats">
        <article className="promotions-stat-card">
          <div className="promotions-stat-head">
            <span className="promotions-stat-title">Active Promos</span>
            <span className="promotions-stat-icon">
              <AppIcon name="BadgePercent" size={18} />
            </span>
          </div>
          <strong className="promotions-stat-value">{metrics.activeCount}</strong>
          <span className="promotions-stat-subtle">Running now</span>
        </article>

        <article className="promotions-stat-card">
          <div className="promotions-stat-head">
            <span className="promotions-stat-title">Total Discounts</span>
            <span className="promotions-stat-icon">
              <AppIcon name="Banknote" size={18} />
            </span>
          </div>
          <strong className="promotions-stat-value">{formatCurrency(metrics.totalDiscounts)}</strong>
          <span className="promotions-stat-subtle">From actual promo usage</span>
        </article>

        <article className="promotions-stat-card">
          <div className="promotions-stat-head">
            <span className="promotions-stat-title">Promos Used Today</span>
            <span className="promotions-stat-icon">
              <AppIcon name="Users" size={18} />
            </span>
          </div>
          <strong className="promotions-stat-value">{metrics.promoUsedToday}</strong>
          <span className="promotions-stat-subtle">Sales using promo today</span>
        </article>

        <article className="promotions-stat-card is-highlight">
          <div className="promotions-stat-head">
            <span className="promotions-stat-title">Scheduled</span>
            <span className="promotions-stat-icon">
              <AppIcon name="CalendarDays" size={18} />
            </span>
          </div>
          <strong className="promotions-stat-value">{metrics.scheduledCount}</strong>
          <span className="promotions-stat-subtle">Not live yet</span>
        </article>
      </section>

      <div className="promotions-banani-tabs" role="tablist" aria-label="Promotion status">
        {[
          ["all", "All"],
          ["active", "Active"],
          ["scheduled", "Scheduled"],
          ["ended", "Ended"],
        ].map(([value, label]) => (
          <button
            className={`promotions-banani-tab${statusFilter === value ? " is-active" : ""}`}
            key={value}
            onClick={() => setStatusFilter(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <section className="promotions-banani-toolbar">
        <div className="promotions-banani-toolbar-group">
          <label className="promotions-banani-search" htmlFor="promotions-search">
            <AppIcon name="Search" size={16} />
            <Input
              className="promotions-banani-search-input"
              id="promotions-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search promotions, codes"
              value={query}
            />
          </label>

          <label className="promotions-banani-select">
            <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">Filter: All</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="ended">Ended</option>
            </select>
            <span className="promotions-banani-select-icon" aria-hidden="true">
              <AppIcon name="Filter" size={16} />
            </span>
          </label>

          <label className="promotions-banani-select">
            <select onChange={(event) => setSortBy(event.target.value)} value={sortBy}>
              <option value="status">Sort: Status</option>
              <option value="latest">Sort: Latest</option>
              <option value="usage">Sort: Usage</option>
            </select>
            <span className="promotions-banani-select-icon" aria-hidden="true">
              <AppIcon name="ArrowUpDown" size={16} />
            </span>
          </label>
        </div>

        <p className="promotions-banani-page-info">
          Showing {paginatedRows.items.length} of {filteredRows.length} promotions
        </p>
      </section>

      <section className="promotions-banani-table-card">
        {paginatedRows.items.length ? (
          <>
            <div className="promotions-banani-table-wrap">
              <table className="promotions-banani-table">
                <thead>
                  <tr>
                    <th>Promotion</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Usage</th>
                    <th>Validity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.items.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="promotions-name-cell">
                          <strong className="promotions-name">{row.code}</strong>
                          <span className="promotions-code-chip">{row.code}</span>
                        </div>
                      </td>
                      <td>
                        <div className="promotions-type-cell">
                          <span className="promotions-type-icon">
                            <AppIcon name={row.type === "percentage" ? "BadgePercent" : "Banknote"} size={16} />
                          </span>
                          <span>{row.typeLabel}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`promotions-status-badge ${row.status.tone}`}>{row.status.label}</span>
                      </td>
                      <td>
                        <div className="promotions-usage-cell">
                          <span className="promotions-usage-text">
                            {row.hasUsageData ? `${row.usageCount} uses` : "No usage data"}
                          </span>
                          <span className="promotions-usage-subtle">
                            {row.hasUsageData ? formatCurrency(row.totalDiscount) : "-"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="promotions-validity-cell">
                          <span className="promotions-validity-dates">{formatValidityRange(row.startAt, row.endAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="promotions-actions-cell">
                          <Button asChild size="sm" variant="outline">
                            <Link to="/promotions/new">Open</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="promotions-banani-pagination">
              <p className="promotions-banani-page-info">
                Page {paginatedRows.page} of {paginatedRows.totalPages}
              </p>

              <div className="promotions-banani-page-controls">
                <Button
                  disabled={paginatedRows.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <AppIcon name="ChevronLeft" size={16} />
                </Button>
                <Button
                  disabled={paginatedRows.page >= paginatedRows.totalPages}
                  onClick={() => setPage((current) => Math.min(paginatedRows.totalPages, current + 1))}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <AppIcon name="ChevronRight" size={16} />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="promotions-banani-empty">
            No promotions match the current filter state. Broaden the search or create a new rule.
          </div>
        )}
      </section>
    </div>
  );
}
