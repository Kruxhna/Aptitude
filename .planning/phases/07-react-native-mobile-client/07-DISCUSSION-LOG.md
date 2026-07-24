# Phase 7: React Native Mobile Client - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-24
**Phase:** 07-React Native Mobile Client
**Areas discussed:** Navigation & Screen Structure, Sprint UI, Visual Design, Dashboard Charts

---

## Navigation & Screen Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom tab bar (4 tabs) | Home, Sprint, Dashboard, Leaderboard. Results as stack modal. | ✓ |
| Stack-only with drawer | Side menu navigation. Simpler but less discoverable. | |
| Bottom tabs + top tabs | Nested tab navigation within Dashboard. | |

**User's choice:** Bottom tab bar with Expo Router (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Expo Router (file-based) | Built into Expo SDK 52+. Convention-over-config. | ✓ |
| React Navigation (manual) | More control but more boilerplate. | |

**User's choice:** Expo Router (recommended)

---

## Sprint UI

| Option | Description | Selected |
|--------|-------------|----------|
| Countdown timer bar | Animated shrinking bar, turns red in last 25%. | ✓ |
| Circular countdown | Ring with seconds in center. | |
| Simple text timer | Just numbers in corner. | |

**User's choice:** Countdown timer bar (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-advance on answer | 300ms flash then auto-next. No "Next" button. | ✓ |
| Manual advance | Answer + tap "Next" to proceed. | |

**User's choice:** Auto-advance (recommended)

---

## Visual Design

| Option | Description | Selected |
|--------|-------------|----------|
| Dark mode only | Navy/charcoal with vibrant accents. Elevate-inspired. | ✓ |
| Light mode only | White backgrounds with bold colors. | |
| Both with system toggle | Respect device setting. | |

**User's choice:** Dark mode only (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Vibrant per-skill gradients | Each skill gets a distinct gradient (purple, teal, orange, pink). | ✓ |
| Monochrome single accent | One brand color for all accents. | |
| Neon on dark | Cyberpunk-inspired neon. | |

**User's choice:** Vibrant per-skill gradients (recommended)

---

## Dashboard Charts

| Option | Description | Selected |
|--------|-------------|----------|
| react-native-gifted-charts | Pure JS, no native deps, works with Expo Go. | ✓ |
| victory-native | Good API, needs react-native-svg setup. | |
| react-native-chart-kit | Simple but limited customization. | |

**User's choice:** react-native-gifted-charts (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Radial rings + Line chart | 4 radial progress rings + 30-day multi-line trend chart. | ✓ |
| Bar + Area chart | Vertical bars for current, area chart for trends. | |
| Card grid + Sparklines | Big numbers in cards with inline sparklines. | |

**User's choice:** Radial progress rings + Line chart (recommended)

---

## Agent's Discretion

None

## Deferred Ideas

None
