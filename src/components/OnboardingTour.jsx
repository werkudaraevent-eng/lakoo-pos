import { useState, useEffect, useCallback } from "react";

const TOUR_STEPS = [
  {
    target: ".shell-nav",
    title: "Menu Navigasi",
    description: "Ini adalah menu utama Anda. Gunakan untuk berpindah antar fitur seperti Kasir, Katalog, Laporan, dan lainnya.",
    position: "right",
  },
  {
    target: '[href="/catalog"]',
    title: "Katalog Produk",
    description: "Mulai dengan menambahkan produk pertama Anda di sini. Anda bisa tambah manual atau import dari file Excel.",
    position: "right",
  },
  {
    target: '[href="/checkout"]',
    title: "Kasir / POS",
    description: "Setelah produk ditambahkan, gunakan Kasir untuk membuat transaksi penjualan.",
    position: "right",
  },
  {
    target: '[href="/reports"]',
    title: "Laporan & Analitik",
    description: "Pantau performa bisnis Anda di sini — pendapatan, produk terlaris, dan metode pembayaran.",
    position: "right",
  },
  {
    target: '[href="/settings"]',
    title: "Pengaturan",
    description: "Atur nama toko, metode pembayaran, pajak, dan preferensi struk di halaman Pengaturan.",
    position: "right",
  },
];

const STORAGE_KEY = "lakoo-onboarding-completed";

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Delay to let the page render
      const timer = setTimeout(() => setActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const positionTooltip = useCallback(() => {
    if (!active) return;
    const currentStep = TOUR_STEPS[step];
    const el = document.querySelector(currentStep.target);
    if (!el) {
      // If element not found, skip to next or end
      if (step < TOUR_STEPS.length - 1) setStep(step + 1);
      else handleFinish();
      return;
    }

    const rect = el.getBoundingClientRect();
    const pos = currentStep.position || "right";

    let style = {};
    if (pos === "right") {
      style = {
        top: rect.top + rect.height / 2 - 60,
        left: rect.right + 16,
      };
    } else if (pos === "bottom") {
      style = {
        top: rect.bottom + 12,
        left: rect.left + rect.width / 2 - 160,
      };
    } else if (pos === "left") {
      style = {
        top: rect.top + rect.height / 2 - 60,
        left: rect.left - 340,
      };
    }

    // Ensure tooltip stays within viewport
    if (style.top < 10) style.top = 10;
    if (style.left < 10) style.left = 10;
    if (style.left > window.innerWidth - 340) style.left = window.innerWidth - 350;

    setTooltipStyle(style);

    // Highlight the element
    el.style.position = el.style.position || "relative";
    el.style.zIndex = "10001";
    el.style.boxShadow = "0 0 0 4px rgba(184, 134, 11, 0.3)";
    el.style.borderRadius = "8px";

    return () => {
      el.style.zIndex = "";
      el.style.boxShadow = "";
    };
  }, [active, step]);

  useEffect(() => {
    const cleanup = positionTooltip();
    // Clean up previous highlight
    return () => {
      if (cleanup) cleanup();
      // Reset all highlights
      TOUR_STEPS.forEach((s) => {
        const el = document.querySelector(s.target);
        if (el) {
          el.style.zIndex = "";
          el.style.boxShadow = "";
        }
      });
    };
  }, [positionTooltip]);

  function handleNext() {
    // Clean current highlight
    const currentEl = document.querySelector(TOUR_STEPS[step].target);
    if (currentEl) {
      currentEl.style.zIndex = "";
      currentEl.style.boxShadow = "";
    }

    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  }

  function handleFinish() {
    // Clean all highlights
    TOUR_STEPS.forEach((s) => {
      const el = document.querySelector(s.target);
      if (el) {
        el.style.zIndex = "";
        el.style.boxShadow = "";
      }
    });
    localStorage.setItem(STORAGE_KEY, "true");
    setActive(false);
  }

  function handleSkip() {
    handleFinish();
  }

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];

  return (
    <>
      {/* Overlay */}
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

      {/* Tooltip */}
      <div
        style={{
          position: "fixed",
          zIndex: 10002,
          background: "#fff",
          borderRadius: 12,
          padding: "20px 24px",
          width: 320,
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
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
