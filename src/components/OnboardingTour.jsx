import { useState, useEffect, useCallback, useRef } from "react";

const TOUR_STEPS = [
  {
    target: ".shell-nav",
    title: "Menu Navigasi",
    description: "Ini adalah menu utama Anda. Gunakan untuk berpindah antar fitur seperti Kasir, Katalog, Laporan, dan lainnya.",
    position: "right",
  },
  {
    target: '.shell-nav a[href="/catalog"]',
    title: "Katalog Produk",
    description: "Mulai dengan menambahkan produk pertama Anda di sini. Anda bisa tambah manual atau import dari file Excel.",
    position: "right",
  },
  {
    target: '.shell-nav a[href="/checkout"]',
    title: "Kasir / POS",
    description: "Setelah produk ditambahkan, gunakan Kasir untuk membuat transaksi penjualan.",
    position: "right",
  },
  {
    target: '.shell-nav a[href="/reports"]',
    title: "Laporan & Analitik",
    description: "Pantau performa bisnis Anda di sini — pendapatan, produk terlaris, dan metode pembayaran.",
    position: "right",
  },
  {
    target: '.shell-nav a[href="/settings"]',
    title: "Pengaturan",
    description: "Atur nama toko, metode pembayaran, pajak, dan preferensi struk di halaman Pengaturan.",
    position: "right",
  },
];

const STORAGE_KEY = "lakoo-onboarding-completed";
const TT_WIDTH = 320;
const TT_HEIGHT = 200;
const MARGIN = 12;

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [highlightRect, setHighlightRect] = useState(null);
  const measureTimerRef = useRef(null);

  // Show tour on first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Compute positions — runs whenever step or active changes, plus on resize/scroll
  const measure = useCallback(() => {
    if (!active) return;
    const currentStep = TOUR_STEPS[step];
    const el = document.querySelector(currentStep.target);
    if (!el) {
      // Skip step if element missing (e.g., user role doesn't have access)
      if (step < TOUR_STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
        finishTour();
      }
      return;
    }

    const rect = el.getBoundingClientRect();
    setHighlightRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });

    // Calculate tooltip position
    const pos = currentStep.position || "right";
    let style = {};
    if (pos === "right") {
      style = {
        top: rect.top + rect.height / 2 - TT_HEIGHT / 2,
        left: rect.right + 16,
      };
    } else if (pos === "bottom") {
      style = {
        top: rect.bottom + MARGIN,
        left: rect.left + rect.width / 2 - TT_WIDTH / 2,
      };
    } else if (pos === "left") {
      style = {
        top: rect.top + rect.height / 2 - TT_HEIGHT / 2,
        left: rect.left - TT_WIDTH - 16,
      };
    }

    // Clamp horizontally
    if (style.left < MARGIN) style.left = MARGIN;
    if (style.left + TT_WIDTH > window.innerWidth - MARGIN) {
      style.left = window.innerWidth - TT_WIDTH - MARGIN;
    }

    // Clamp vertically — try above element if no room below
    if (style.top < MARGIN) style.top = MARGIN;
    if (style.top + TT_HEIGHT > window.innerHeight - MARGIN) {
      const aboveTop = rect.top - TT_HEIGHT - MARGIN;
      if (aboveTop >= MARGIN) {
        style.top = aboveTop;
      } else {
        style.top = window.innerHeight - TT_HEIGHT - MARGIN;
      }
    }

    setTooltipStyle(style);
  }, [active, step]);

  // Trigger scroll-into-view + measure when step changes
  useEffect(() => {
    if (!active) return;
    const currentStep = TOUR_STEPS[step];
    const el = document.querySelector(currentStep.target);
    if (!el) {
      // Try to skip
      if (step < TOUR_STEPS.length - 1) {
        setStep((s) => s + 1);
      } else {
        finishTour();
      }
      return;
    }

    // Hide highlight while scrolling, then re-measure after scroll settles
    setHighlightRect(null);
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    // Wait for smooth scroll to finish (~300ms) then measure
    if (measureTimerRef.current) clearTimeout(measureTimerRef.current);
    measureTimerRef.current = setTimeout(() => {
      measure();
    }, 380);

    return () => {
      if (measureTimerRef.current) clearTimeout(measureTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step]);

  // Re-measure on window resize/scroll while tour is active
  useEffect(() => {
    if (!active) return;
    const handler = () => measure();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [active, measure]);

  function handleNext() {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finishTour();
    }
  }

  function finishTour() {
    localStorage.setItem(STORAGE_KEY, "true");
    setActive(false);
    setHighlightRect(null);
  }

  function handleSkip() {
    finishTour();
  }

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];

  return (
    <>
      {/* Dim overlay (full page) */}
      <div
        onClick={handleSkip}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
          cursor: "pointer",
        }}
      />

      {/* Highlight box (only when target measured) */}
      {highlightRect && (
        <div
          style={{
            position: "fixed",
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            border: "3px solid rgba(184, 134, 11, 0.95)",
            borderRadius: 10,
            pointerEvents: "none",
            zIndex: 10001,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
            transition: "all 0.2s ease",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        style={{
          position: "fixed",
          zIndex: 10002,
          background: "#fff",
          borderRadius: 12,
          padding: "20px 24px",
          width: TT_WIDTH,
          maxHeight: "calc(100vh - 24px)",
          overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
          opacity: highlightRect ? 1 : 0,
          transition: "opacity 0.2s ease",
          ...tooltipStyle,
        }}
      >
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 8,
                height: 4,
                borderRadius: 2,
                background: i === step ? "var(--accent, #b8860b)" : "var(--line, #e0e0e0)",
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>

        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6, color: "var(--text, #1a1a1a)" }}>
          {currentStep.title}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-soft, #666)", lineHeight: 1.6, marginBottom: 16 }}>
          {currentStep.description}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={handleSkip}
            style={{
              background: "none",
              border: "none",
              fontSize: 12.5,
              color: "var(--text-muted, #999)",
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            Lewati
          </button>
          <button
            onClick={handleNext}
            style={{
              background: "var(--accent, #b8860b)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {step < TOUR_STEPS.length - 1 ? "Lanjut →" : "Selesai ✓"}
          </button>
        </div>
      </div>
    </>
  );
}

// Export for manual trigger (e.g., from Settings)
export function resetOnboardingTour() {
  localStorage.removeItem(STORAGE_KEY);
}
