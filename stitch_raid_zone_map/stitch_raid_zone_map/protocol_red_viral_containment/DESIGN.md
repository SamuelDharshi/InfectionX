# Design System Document: Protocol Red: Viral Containment

## 1. Overview & Creative North Star
**Creative North Star: The Terminal of Last Resort**

This design system is not a "user interface"—it is a high-alert, tactical Head-Up Display (HUD) surviving a catastrophic biological failure. It must feel like a terminal found in a quarantined bunker: technical, urgent, and slightly unstable. 

To move beyond "standard" horror tropes, we reject traditional UI softness. We embrace **Brutal Technicality**. By utilizing a monospaced typographic rhythm and a rigid 0px border radius, we communicate a sense of cold, unyielding emergency. We break the "template" look through intentional glitch aesthetics, staggered asymmetrical layouts, and high-contrast "red-on-red" layering that mimics a monitor straining to stay powered during an outbreak.

---

## 2. Colors
The palette is a descent into bio-hazard urgency. We move from the bruised blacks of a dead facility to the searing luminosity of an active alarm.

### The Palette (Material Design 3 Mapping)
*   **Surface/Background:** `#200e0e` (A suffocating, blood-tinged black)
*   **Primary (Action):** `#ffb4ac` (High-visibility alert pink-red)
*   **Primary Container (The "Blood" Base):** `#b22222` (Deep Crimson)
*   **Secondary (Alerts):** `#ffb4ab` / `#d30017`
*   **On-Surface (Text):** `#fedad8` (Desaturated bone-white)

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid strokes to separate content. In a survival scenario, boundaries are defined by light and shadow, not ink. 
*   Separate global sections using background shifts (e.g., placing a `surface-container-low` block directly against the `surface` background).
*   If a division is mandatory, use a "Pulse Gap"—a `2px` transparent gutter that lets the background bleed through.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked tactical panels. 
*   **Level 1 (Base):** `surface` (#200e0e)
*   **Level 2 (Panels):** `surface-container-low` (#2a1616)
*   **Level 3 (Interactive/Critical):** `surface-container-high` (#3a2424)
*   **The Glitch Overlay:** For modal-level urgency, use a semi-transparent `primary-container` (#b22222 at 40% opacity) with a `12px` backdrop-blur to simulate a bleeding HUD element.

---

## 3. Typography
**Typeface: Space Grotesk**
This monospaced-leaning technical font is our voice. It should feel like data being streamed from a failing containment server.

*   **Display (The Alarm):** `display-lg` (3.5rem). Use sparingly for "CRITICAL" or "BREACH" status updates. Set with `-0.05em` letter spacing to feel crushed and urgent.
*   **Headline (The Directive):** `headline-md` (1.75rem). All-caps. This is for section headers like "BIO-DATA SCAN" or "CONTAINMENT RADIUS."
*   **Title (The Data Point):** `title-md` (1.125rem). Used for card headers.
*   **Body (The Status):** `body-md` (0.875rem). The workhorse for logs and terminal entries.
*   **Label (The Metadata):** `label-sm` (0.6875rem). Monospaced metadata (Timestamps, Lat/Long).

---

## 4. Elevation & Depth
In this design system, elevation is **Tonal Alertness**, not physical height.

*   **The Layering Principle:** Depth is achieved by "stacking" heat. As information becomes more critical (higher infection risk/emergency level), the background color should shift from the dark `surface` toward the warmer `surface-container-highest`.
*   **Ambient Shadows:** Traditional shadows are forbidden. Instead, use "Glow Bleed." Floating elements should have a wide, diffused outer glow using the `primary` color (#ffb4ac) at 5% opacity to mimic the bloom of a CRT monitor.
*   **The "Ghost Border" Fallback:** If a container requires definition against a similar tone, use the `outline-variant` token at **15% opacity**. It must look like a faint, flickering laser line, not a solid border.
*   **Tactical Glitch:** Use the `2.5` spacing unit to create intentional "misalignments" in secondary info panels, breaking the perfect vertical grid to imply system instability.

---

## 5. Components

### Buttons (The Trigger)
*   **Primary:** Solid `primary-container` (#b22222), `0px` radius, `Space Grotesk` Bold, All-Caps. 
*   **State:** On hover, shift to `primary` (#ffb4ac) with a 2px horizontal offset to simulate a "glitch" jump.
*   **Tertiary:** No background. `1px` Ghost Border (15% opacity). Text color `primary`.

### Input Fields (The Command Line)
*   **Style:** No container box. Only a bottom "Ghost Border" (outline-variant at 20%). 
*   **Focus State:** The bottom border becomes `primary` (#ffb4ac) with a flickering "caret" cursor.
*   **Error State:** Text and border shift to `error` (#ffb4ab).

### Cards (The Specimen Container)
*   **Rule:** Forbid divider lines. Use `surface-container-highest` for the header area and `surface-container-low` for the body.
*   **Asymmetry:** Crop one corner (top-right) using a CSS clip-path to give it a "clipped file" or "military ID" aesthetic.

### Data Chips (Status Indicators)
*   Small, rectangular boxes. `label-sm` text. 
*   **Infection Level:** Use a gradient from `primary-container` to `secondary-container` to show a "spectrum of danger."

### Additional Component: The "Scan-Line" Overlay
*   A global fixed overlay using a repeating linear gradient of 2px transparent and 1px `on-surface` (at 3% opacity). This provides the "Technical HUD" texture across the entire experience.

---

## 6. Do's and Don'ts

### Do:
*   **DO** use strict 0px corners. Roundness is for safety; this system is about danger.
*   **DO** use "staggered" layouts. If you have a list of items, offset every second item by `spacing.4` to create a technical, non-traditional rhythm.
*   **DO** use monospaced alignment for numbers. Timestamps and coordinates must line up vertically.

### Don't:
*   **DON'T** use pure white. Use `on-surface` (#fedad8) to keep the "low-light bunker" atmosphere.
*   **DON'T** use standard drop shadows. They look like "software"; we want "hardware."
*   **DON'T** use icons with rounded terminals. Use sharp, jagged, or pixel-perfect iconography.
*   **DON'T** use the color blue. Any trace of the old 'Cobalt Protocol' must be purged; all highlights are now Viral Red.

### Accessibility Note:
While emphasizing "glitch" and "danger," maintain a minimum contrast ratio of 4.5:1 for all critical status text. High-stakes survival requires the user to be able to read the data under pressure.