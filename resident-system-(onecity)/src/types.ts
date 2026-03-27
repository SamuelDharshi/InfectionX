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
  archetype: Archetype;
  oneId: string;
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
  name: string;
  health: number;
  threatLevel: number;
  distance: number;
  image: string;
}

export interface CityState {
  infectionRate: number;
  totalSurvivors: number;
  activeRaids: number;
}
