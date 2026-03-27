# Design System Strategy: The Synthetic Eye

## 1. Overview & Creative North Star
**Creative North Star: The Synthetic Eye**
This design system is not a static interface; it is a tactical digital overlay projected onto the retina of a survivor. It must feel like a failing, high-tech military HUD—authoritative and precise, yet physically strained by the "glitch" of a post-apocalyptic environment. 

We move beyond standard gaming UIs by embracing **Organic Brutalism**. We reject soft curves and friendly buffers. Instead, we use aggressive, razor-sharp edges (0px radius), high-contrast "System Blue" luminescence, and intentional asymmetry to evoke the feeling of a police database being hacked in real-time. This is functional minimalism pushed to a point of survivalist tension.

## 2. Colors: High-Voltage Monochromatics
The palette is dominated by `surface-dim` (#131313) to represent the void of the city, punctuated by the high-frequency "System Blue" of our `primary` tokens.

*   **The "No-Line" Rule:** Standard 1px borders are strictly prohibited for structural sectioning. To separate the "Inventory" from the "Map," do not draw a box. Instead, use a background shift from `surface-container-low` to `surface-container-high`. Boundaries are defined by light emission, not ink.
*   **Surface Hierarchy & Nesting:** Use the surface-container tiers to create "data-depth." 
    *   Base Layer: `surface` (#131313)
    *   Active Module: `surface-container-high` (#2a2a2a)
    *   Focused Data Point: `surface-container-highest` (#353534)
*   **The "Glass & Gradient" Rule:** To simulate a holographic HUD, use `surface-variant` with a 40-60% opacity and a `backdrop-blur` of 12px. For primary action items, apply a subtle linear gradient from `primary` (#a4e6ff) to `primary-container` (#00d1ff) at a 45-degree angle to give the "neon" a sense of electrical current.
*   **Warning States:** `error` (#ffb4ab) is reserved for critical system failure and proximity alerts. Use `on-error-container` for text within these high-alert zones to ensure maximum legibility against the dark background.

## 3. Typography: The Database Aesthetic
We use **Space Grotesk** exclusively. Its monospaced-adjacent construction evokes the cold, calculated feel of a terminal.

*   **The Informational Hierarchy:**
    *   **Display LG (3.5rem):** Reserved for "SYSTEM CRITICAL" or "LOCATION DISCOVERED" flashes. Use all-caps with 0.1rem letter spacing.
    *   **Headline MD (1.75rem):** Used for tactical headers (e.g., "AMMO COUNT," "BIO-SIGNALS").
    *   **Label SM (0.6875rem):** The workhorse of the HUD. Use this for tech-specs, coordinates, and micro-data.
*   **Visual Soul:** Use `primary` for headers to simulate a glowing screen, and `secondary` or `on-surface-variant` for body text to reduce eye strain while maintaining the "scanline" aesthetic.

## 4. Elevation & Depth: Tonal Layering
In a world of digital overlays, traditional shadows do not exist. We replace "drop shadows" with **Tonal Lift**.

*   **The Layering Principle:** A "floating" scanner window should be `surface-container-highest`. To make it feel detached from the background, do not use a black shadow. Use a "Glow Shadow": a `primary` tinted shadow at 5% opacity with a 30px blur. This suggests the UI is casting light onto the player's face.
*   **The "Ghost Border" Fallback:** For buttons or inputs that require a clear hit-box, use the `outline-variant` (#3c494e) at 20% opacity. It should look like a faint scanline, not a solid frame.
*   **Asymmetry as Depth:** Offset inner containers by `0.2rem` (Spacing 1) to create a "glitch-shifted" look, suggesting the system is slightly uncalibrated.

## 5. Components: Tactical Modules

*   **Buttons:** 
    *   **Primary:** Solid `primary` background with `on-primary` text. **No rounded corners.** 
    *   **Tertiary:** Transparent background, `primary` text, with a `0.1rem` left-hand border accent only. This creates a "bracket" look common in military scanners.
*   **Input Fields:** Use `surface-container-lowest` for the field. The cursor should be a blinking `primary` block. Labels must be in `label-sm` and positioned *inside* the top-left corner of the box.
*   **Lists & Grids:** Strictly forbid dividers. Use `Spacing 4` (0.9rem) to create clear air between items. If items must be grouped, use a subtle background shift to `surface-container-low`.
*   **The "Glitch" Progress Bar:** Use `primary` for the fill, but introduce a 2px gap every 10% of the bar to make it look like segmented data processing.
*   **Scanner Overlay (Specialty Component):** A full-screen `outline-variant` grid with 5% opacity. This remains fixed while the UI scrolls, reinforcing the "Digital Lens" feel.

## 6. Do's and Don'ts

*   **DO:** Use `Spacing 0.5` (0.1rem) for tight technical data clusters.
*   **DO:** Use `tertiary-container` (#ffaaa9) for "Warning-Lite" states, such as low health or empty magazines.
*   **DON'T:** Use any border-radius. Every element must have a 90-degree "Hard Edge."
*   **DON'T:** Use pure white (#FFFFFF). All "light" must be tinted with the `primary` or `on-surface` tones to maintain the atmospheric immersion.
*   **DO:** Leverage the "Asymmetric Layout." If a menu is centered, shift the header 1.75rem to the left. It should feel like a military readout, not a marketing website.
*   **DON'T:** Use standard "Fade" transitions. Use "Step" or "Glitch" animations where elements snap into existence or flicker (opacity 0% -> 100% -> 50% -> 100%).