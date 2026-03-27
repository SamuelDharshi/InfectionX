export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID ?? "";

export const MODULES = {
  hunter: "hunter",
  sessionKey: "session_key",
  survival: "survival",
  virusState: "virus_state",
  zombie: "zombie",
  raid: "raid",
  inventory: "inventory",
} as const;

export const TYPES = {
  hunter: `${PACKAGE_ID}::hunter::Hunter`,
  sessionKey: `${PACKAGE_ID}::session_key::SessionKey`,
  smallZombie: `${PACKAGE_ID}::zombie::SmallZombie`,
  bigZombie: `${PACKAGE_ID}::zombie::BigZombie`,
  virusState: `${PACKAGE_ID}::virus_state::VirusState`,
  raidLobby: `${PACKAGE_ID}::raid::RaidLobby`,
  greenHerb: `${PACKAGE_ID}::inventory::GreenHerb`,
  ammo: `${PACKAGE_ID}::inventory::Ammo`,
  vaccineFragment: `${PACKAGE_ID}::inventory::VaccineFragment`,
} as const;
