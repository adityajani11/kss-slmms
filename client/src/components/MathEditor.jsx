import React, { useEffect, useRef } from "react";
import "mathlive";

export default function MathEditor({ value, onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;

    // Force permanent text mode (this stops the blue math-highlight block)
    el.setOptions({
      defaultMode: "text",
      smartFence: false,
      removeExtraneousSpaces: false,
      letterShapeStyle: "upright",
      smartMode: false, // <- KEY FIX (prevents auto-switch to math mode)
      mathMode: "text", // <- FORCE editor to behave like normal text
    });

    // Remove blue background coloring inside shadow DOM
    const removeBlueOverlay = () => {
      const root = el.shadowRoot;
      if (!root) return;

      // These 3 layers cause the block highlight:
      root
        .querySelectorAll(".ML__selection, .ML__highlight, .ML__background")
        .forEach((node) => (node.style.background = "transparent"));
    };

    // Run once initially
    removeBlueOverlay();

    // Run again whenever rendering updates
    const observer = new MutationObserver(removeBlueOverlay);
    observer.observe(el.shadowRoot, { childList: true, subtree: true });

    el.addEventListener("input", () => onChange(el.value));

    return () => observer.disconnect();
  }, [onChange]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-2">
        {[
          ["\\pi", "π"],
          ["\\alpha", "α"],
          ["\\beta", "β"],
          ["\\gamma", "γ"],
          ["\\lambda", "λ"],
          ["\\theta", "θ"],
          ["\\sin", "sin"],
          ["\\cos", "cos"],
          ["\\tan", "tan"],
          ["\\degree", "°"],
          ["Δ", "Δ"],
        ].map(([cmd, label]) => (
          <button
            key={label}
            onClick={() => ref.current.executeCommand("insert", cmd)}
            className="px-2 py-1 rounded border border-gray-400 bg-gray-50 hover:bg-gray-200 text-sm"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Editable Math Field */}
      <math-field
        ref={ref}
        default-mode="text"
        /* Also set vars inline here for first paint before useEffect runs */
        style={{
          width: "100%",
          minHeight: "80px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          padding: "8px",
          background: "white",
          fontSize: "18px",
          // 🔧 inline CSS vars (shadow DOM-safe)
          ["--selection-background-color"]: "transparent",
          ["--highlight-background-color"]: "transparent",
          ["--mathlive-selection-background-color"]: "transparent",
          ["--mathlive-suggestion-background-color"]: "transparent",
          ["--virtual-keyboard-border-color"]: "transparent",
          ["--virtual-keyboard-button-focus-outline-color"]: "transparent",
          ["--caret-color"]: "#111",
        }}
        spellcheck="false"
      >
        {value}
      </math-field>
    </div>
  );
}
