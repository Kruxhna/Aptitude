export type MascotEmotion =
  | 'IDLE_HOVER'       // Standard floating bob
  | 'EXCITED_JUMP'     // Correct answers, level-up milestones, streaks
  | 'SAD_HEADSHAKE'    // Incorrect answers / mistakes
  | 'WORRIED_SWEAT'    // Critical timer threshold (< 20% time)
  | 'SLEEPING_ZZZ';    // Inactive > 48 hours

export type CostumeId =
  | 'DEFAULT'
  | 'GRAD_CAP'
  | 'NERD_GLASSES'
  | 'SUPERHERO_CAPE'
  | 'WIZARD_HAT'
  | 'ASTRONAUT_HELMET';

export interface CostumeCatalogItem {
  id: CostumeId;
  name: string;
  description: string;
  priceXP: number;
  icon: string;
  category: 'HEAD' | 'FACE' | 'BACK';
  isUnlocked: boolean;
  isEquipped: boolean;
}

export interface MascotState {
  emotion: MascotEmotion;
  activeCostume: CostumeId;
  unlockedCostumes: CostumeId[];
  lastActiveAt?: string | null;
}
