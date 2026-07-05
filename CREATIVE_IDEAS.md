# Creative direction notes

Options gathered while researching how to make the zone-reveal moment and the
world itself feel less generic. Genre reference: Bruno Simon's portfolio
(browser 3D car + physics playground) — this project's own code already calls
the current side panel "Bruno Simon Style HUD," which was the cue to look for
something more distinctive than a right-side drawer.

Sources consulted:
- https://www.awwwards.com/bruno-simon-portfolio-wins-site-of-the-month-november.html
- https://www.awwwards.com/sites/virtual-car-showroom
- https://www.yamii.shop/2026/04/04/diegetic-ui-guide/
- https://www.wayline.io/blog/diegetic-interfaces-game-design

Core idea across all of them: the strongest interfaces in games/3D sites are
**diegetic** — they live inside the world instead of floating as chrome on
top of it.

## A. Zone-reveal concept (pick one)

### 1. Holographic projection — ❌ TRIED, replaced
Built first: the zone's monument became the display, with a translucent glass
card floating above it in 3D, tracked via screen-space projection. In practice
the `backdrop-filter` blur sampled the busy, saturated 3D scene behind it and
smeared into a muddy gray-orange mess instead of clean glass, and centering
it on the monument blocked the car. Fixed the blur/contrast once, but the
concept itself was replaced at the user's request in favor of #3 below.

### 2. Garage / dossier
Camera cuts to a cinematic orbit around the car parked at a pedestal, like a
dealership configurator. Project details render as a blueprint-style spec
sheet (line-draw reveal, animated "DEPLOYED" stamp) — reframes each project
as a vehicle being inspected. Echoes the "Virtual Car Showroom" Awwwards
genre directly.

### 3. Signal terminal — ❌ TRIED, replaced
Entering a zone played as "picking up a transmission," with content typing
out in a retro terminal window (traffic-light dots, monospace, scanline
flicker). Reworked once from prose+bullets into real labeled fields
(`[STATUS]`, `[NAME]`, numbered `[01]` log lines) per the user's "both
content and chrome" feedback. Still fundamentally a floating rectangle with
text in it, though — replaced at the user's request in favor of #5 below,
which isn't a card/window shape at all.

### 4. Cinematic takeover
Full-bleed editorial "magazine spread" instead of a 450px sidebar — huge
kinetic typography, the 3D world blurred/dimmed behind via depth-of-field,
not boxed into a drawer. Highest visual drama, biggest departure from the
current layout. Not tried.

### 5. Dashboard instrument cluster — ✅ SELECTED, implemented
No card/window at all. A car-dashboard strip slides up from the bottom edge
of the screen — diegetic to the vehicle you're already driving, not a UI
layer on top of it. STACK/FOCUS/etc. render as a real SVG tachometer gauge
(needle sweeps in on reveal), tags as a bracket-style legend beside it,
description+bullets as a single scrolling LCD trip-computer ticker instead of
paragraph/list, and a status LED instead of a text label. Only the Contact
zone breaks the pure-gauge metaphor (a compact form slots in below the
instruments, since you actually need to type a message). `InstrumentGauge`
and `LcdTicker` components in App.jsx; `dashData` object maps each zone's
name/type/gauge value/tags/ticker text/action in one place.

## B. World-interactivity upgrades (pick any — additive, not exclusive)

### 1. Trick/combo scoring — ✅ SELECTED, being implemented
Air time off ramps, drift chains, near-misses earn a combo score with
floating popups and a small HUD counter. Turns idle exploring into something
a bit game-like.

### 2. Living ambience
Birds, wind-blown grass, distant NPC traffic on the road, slow day/night
light drift, layered ambient soundscape — matches Bruno Simon's own
spatialized-audio approach.

### 3. Reactive props
Honk the horn to scatter a pigeon flock, more physics-enabled crates/cones
that scatter realistically when hit, windmills that spin faster the closer
you drive.

### 4. Wayfinding glow trail
A subtle glowing breadcrumb trail / signage pointing toward unvisited zones,
pulsing stronger as you approach — nicer polish and solves the "where do I
go" problem the minimap only partially answers.

---
If the holographic reveal or combo scoring don't land after trying them,
come back to this file and pick a different option from either list instead
of starting from scratch.
