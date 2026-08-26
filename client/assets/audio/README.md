# Audio Assets — GATE Aptitude Trainer

This directory contains all sound effects used by the app.

## Required Files

| Filename | Trigger | Volume | Notes |
|---|---|---|---|
| `pop-correct.mp3` | Correct answer | 60% | Subtle pop |
| `descending-wrong.mp3` | Wrong answer | 70% | Descending tone |
| `streak-chime.mp3` | Streak continued | 80% | Satisfying chime |
| `level-up.mp3` | Level up / achievement | 90% | Celebratory fanfare |
| `sprint-start.mp3` | Sprint begins | 50% | Quick whoosh |
| `sprint-end.mp3` | Sprint results shown | 50% | Gentle completion |
| `timer-tick.mp3` | Last 5s countdown | 20% | Subtle tick |
| `button-tap.mp3` | UI button interactions | 30% | Light tap |
| `xp-earn.mp3` | XP counter increments | 60% | Coin-like |
| `mascot-jump.mp3` | SPRINTY jumps | 50% | Playful bounce |

## Specifications

- **Format:** MP3
- **Sample rate:** 44.1 kHz  
- **Bitrate:** 128 kbps  
- **Max file size:** 200 KB each  
- **Duration:** 0.1s – 2.0s

## Sources (royalty-free)

- [Mixkit](https://mixkit.co/free-sound-effects/) — No attribution required
- [Freesound](https://freesound.org/) — Check individual licenses

## Current State

Placeholder 0-byte stubs exist for all files. The `AudioService` gracefully
skips any file that fails to load — no crashes. Replace stubs with real MP3s
at any time; the service picks them up on next app launch.
