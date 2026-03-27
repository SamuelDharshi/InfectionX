module resident_system::zombie {
    use std::vector;

    use sui::object::{Self, ID, UID};
    use sui::random;
    use sui::tx_context::TxContext;

    use resident_system::virus_state::{Self, VirusState};

    const E_SMALL_HP_OUT_OF_RANGE: u64 = 0;
    const E_BIG_OFFICERS_OUT_OF_RANGE: u64 = 1;

    const SMALL_HP_MIN: u64 = 50;
    const SMALL_HP_MAX: u64 = 150;
    const BIG_HP_MIN: u64 = 2000;
    const BIG_HP_MAX: u64 = 10000;

    public struct SmallZombie has key, store {
        id: UID,
        entity_id: u64,
        hp: u64,
        speed_tier: u8,
        loot_pool: vector<u8>,
        xp_reward: u64,
    }

    public struct BigZombie has key, store {
        id: UID,
        area_id: u64,
        hp: u64,
        required_officers: u8,
        vaccine_fragments: u64,
        damage_multiplier: u64,
    }

    public fun spawn_small(
        seed: u64,
        state: &VirusState,
        rng: &mut random::RandomGenerator,
        ctx: &mut TxContext,
    ): SmallZombie {
        let infection = virus_state::get_infection_rate(state);
        let base_hp = random::generate_u64_in_range(rng, SMALL_HP_MIN, SMALL_HP_MAX);
        let speed_tier = random::generate_u8_in_range(rng, 1, 3);

        let mut loot_pool = vector[];
        vector::push_back(&mut loot_pool, (seed % 5) as u8);
        vector::push_back(&mut loot_pool, ((seed + infection) % 8) as u8);

        SmallZombie {
            id: object::new(ctx),
            entity_id: seed,
            hp: base_hp,
            speed_tier,
            loot_pool,
            xp_reward: 10 + infection,
        }
    }

    public fun spawn_big(
        area_id: u64,
        state: &VirusState,
        rng: &mut random::RandomGenerator,
        ctx: &mut TxContext,
    ): BigZombie {
        let infection = virus_state::get_infection_rate(state);
        let base_hp = random::generate_u64_in_range(rng, BIG_HP_MIN, BIG_HP_MAX);

        BigZombie {
            id: object::new(ctx),
            area_id,
            hp: base_hp,
            required_officers: random::generate_u8_in_range(rng, 2, 4),
            vaccine_fragments: 1 + ((area_id + infection) % 6),
            damage_multiplier: 100 + (infection * 2),
        }
    }

    #[test_only]
    public fun spawn_big_for_testing(
        area_id: u64,
        hp: u64,
        required_officers: u8,
        vaccine_fragments: u64,
        ctx: &mut TxContext,
    ): BigZombie {
        BigZombie {
            id: object::new(ctx),
            area_id,
            hp,
            required_officers,
            vaccine_fragments,
            damage_multiplier: 100,
        }
    }

    public(package) fun object_id_big(zombie: &BigZombie): ID {
        object::id(zombie)
    }

    public(package) fun area_id_big(zombie: &BigZombie): u64 {
        zombie.area_id
    }

    public(package) fun required_officers(zombie: &BigZombie): u8 {
        zombie.required_officers
    }

    public(package) fun vaccine_fragments(zombie: &BigZombie): u64 {
        zombie.vaccine_fragments
    }

    public(package) fun apply_damage_big(zombie: &mut BigZombie, damage: u64) {
        if (damage >= zombie.hp) {
            zombie.hp = 0;
        } else {
            zombie.hp = zombie.hp - damage;
        }
    }

    #[test_only]
    public fun destroy_big_for_testing(zombie: BigZombie) {
        let BigZombie {
            id,
            area_id: _,
            hp: _,
            required_officers: _,
            vaccine_fragments: _,
            damage_multiplier: _,
        } = zombie;
        object::delete(id);
    }

    public(package) fun entity_id_small(zombie: &SmallZombie): u64 {
        zombie.entity_id
    }

    public(package) fun hp_small(zombie: &SmallZombie): u64 {
        zombie.hp
    }

    public(package) fun apply_damage_small(zombie: &mut SmallZombie, damage: u64) {
        if (damage >= zombie.hp) {
            zombie.hp = 0;
        } else {
            zombie.hp = zombie.hp - damage;
        }
    }

    public fun is_dead_small(zombie: &SmallZombie): bool {
        zombie.hp == 0
    }

    public(package) fun destroy_small(zombie: SmallZombie) {
        let SmallZombie { id, entity_id: _, hp: _, speed_tier: _, loot_pool: _, xp_reward: _ } = zombie;
        object::delete(id);
    }

    public fun is_dead_big(zombie: &BigZombie): bool {
        zombie.hp == 0
    }

    #[test]
    fun test_spawn_small_hp_range() {
        let mut ctx = tx_context::dummy();
        let (state, cap) = virus_state::new_for_testing(&mut ctx);

        let mut rng = random::new_generator_from_seed_for_testing(x"0102030405060708");
        let z = spawn_small(123, &state, &mut rng, &mut ctx);

        assert!(z.hp >= SMALL_HP_MIN, E_SMALL_HP_OUT_OF_RANGE);
        assert!(z.hp <= SMALL_HP_MAX, E_SMALL_HP_OUT_OF_RANGE);

        destroy_small(z);
        virus_state::destroy_for_testing(state, cap);
    }

    #[test]
    fun test_spawn_big_required_officers_range() {
        let mut ctx = tx_context::dummy();
        let (state, cap) = virus_state::new_for_testing(&mut ctx);

        let mut rng = random::new_generator_from_seed_for_testing(x"0a0b0c0d0e0f1011");
        let z = spawn_big(7, &state, &mut rng, &mut ctx);

        assert!(z.required_officers >= 2, E_BIG_OFFICERS_OUT_OF_RANGE);
        assert!(z.required_officers <= 4, E_BIG_OFFICERS_OUT_OF_RANGE);

        destroy_big_for_testing(z);
        virus_state::destroy_for_testing(state, cap);
    }
}
