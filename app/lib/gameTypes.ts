export enum Archetype {
  POINTMAN = 'Pointman',
  MEDIC = 'Medic',
  SHARPSHOOTER = 'Sharpshooter'
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  infectionLevel: number;
  kills: number;
  ammo: number;
  fragments: number;
  archetype: Archetype;
  oneId: string;
  isDead: boolean;
}

export interface GameItem {
  id: string;
  name: string;
  type: 'herb' | 'ammo' | 'fragment';
  count: number;
}

export interface Zombie {
  id: string;
  type: 'Small' | 'Big';
  variant?: number; // 0, 1, 2 for different visuals
  name: string;
  health: number;
  threatLevel: number;
  distance: number;
  isHit?: boolean;
  isAttacking?: boolean;
  isDead?: boolean;
  xOffset: number;
}

export interface CityState {
  infectionRate: number;
  totalSurvivors: number;
  activeRaids: number;
}
