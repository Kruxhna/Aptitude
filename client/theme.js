const designTokens = {
  "THEME": {
    "backgroundLight": "#F4F7FB",
    "cardBackgroundLight": "#FFFFFF",
    "PRIMARY": "#00C4B4",
    "PRIMARY_HOVER": "#00A89A",
    "PRIMARY_ACCENT_TEAL": "#0D9488",
    "textPrimary": "#0F172A",
    "textSecondary": "#64748B",
    "border": "#E2E8F0"
  },
  "SHAPES": {
    "borderRadiusGlobal": "20px",
    "cardBorderRadius": 20,
    "panelBorderRadius": 20
  },
  "ANIMATION_CURVE": {
    "customEase": "cubic-bezier(0.175, 0.885, 0.320, 1.275)",
    "cubicBezierValues": [0.175, 0.885, 0.320, 1.275],
    "durationFast": "200ms",
    "durationMedium": "350ms",
    "durationSlow": "500ms",
    "duolingoBounce": {
      "stiffness": 300,
      "damping": 15
    }
  },
  "SPRITE_SHEETS": {
    "sprintyRobot": {
      "idleHover": {
        "assetPath": "assets/sprites/sprinty_idle_hover_sprite.png",
        "frameCount": 4,
        "frameWidth": 128,
        "frameHeight": 128,
        "fps": 8,
        "loop": true
      },
      "correctAnswerJump": {
        "assetPath": "assets/sprites/sprinty_correct_jump_sprite.png",
        "frameCount": 4,
        "frameWidth": 128,
        "frameHeight": 128,
        "fps": 12,
        "loop": false
      }
    }
  }
};

module.exports = designTokens;
export default designTokens;
