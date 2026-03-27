module resident_system::survival {
    use sui::event;
    use sui::object::ID;
    use sui::random;
    use sui::tx_context::TxContext;

    use resident_system::hunter::{Self, Hunter};
    use resident_system::inventory::{Self, Ammo, GreenHerb};
    use resident_system::session_key::{Self, SessionKey};
    use resident_system::virus_state::{Self, InfectionControlCap, VirusState};
    use resident_system::zombie::{Self, SmallZombie};

    const E_NO_AMMO: u64 = 0;

    public struct CombatEvent has copy, drop {
        hunter_id: ID,
        zombie_id: u64,
        damage: u64,
        killed: bool,
    }

    public struct DamageEvent has copy, drop {
        hunter_id: ID,
        damage: u64,
        infection_added: u64,
    }

    public fun attack_small_with_session(
        key: &SessionKey,
        cap: &InfectionControlCap,
        hunter: &mut Hunter,
        zombie: &mut SmallZombie,
        ammo: &mut Ammo,
        virus_state: &mut VirusState,
        rng: &mut random::RandomGenerator,
        ctx: &mut TxContext,
    ) {
        session_key::assert_valid(key, sui::tx_context::epoch(ctx));
        attack_small(cap, hunter, zombie, ammo, virus_state, rng, ctx);
    }

    public fun attack_small(
        cap: &InfectionControlCap,
        hunter: &mut Hunter,
        zombie: &mut SmallZombie,
        ammo: &mut Ammo,
        virus_state: &mut VirusState,
        rng: &mut random::RandomGenerator,
        ctx: &mut TxContext,
    ) {
        assert!(inventory::ammo_count(ammo) > 0, E_NO_AMMO);
        inventory::consume_one_ammo(ammo);

        let roll = random::generate_u64_in_range(rng, 1, 10);
        let class_modifier = hunter::crit_modifier(hunter);
        let damage = class_modifier * roll;

        zombie::apply_damage_small(zombie, damage);
        let killed = zombie::is_dead_small(zombie);

        if (killed) {
            hunter::add_kill(hunter, 1);
            virus_state::decrease_infection(cap, virus_state, 1, sui::tx_context::epoch(ctx));
            virus_state::add_total_kills(cap, virus_state, 1, sui::tx_context::epoch(ctx));

            let fragment = inventory::mint_fragment(
                zombie::entity_id_small(zombie),
                zombie::entity_id_small(zombie),
                ctx,
            );
            inventory::add_to_inventory_fragment(hunter, fragment);
        };

        event::emit(CombatEvent {
            hunter_id: hunter::object_id(hunter),
            zombie_id: zombie::entity_id_small(zombie),
            damage,
            killed,
        });
    }

    public fun use_herb_with_session(
        key: &SessionKey,
        hunter: &mut Hunter,
        herb: GreenHerb,
        ctx: &TxContext,
    ) {
        session_key::assert_valid(key, sui::tx_context::epoch(ctx));
        use_herb(hunter, herb);
    }

    public fun use_herb(hunter: &mut Hunter, herb: GreenHerb) {
        let heal = inventory::heal_amount(&herb);
        let hp = hunter::hp(hunter);
        let max_hp = hunter::max_hp(hunter);
        let mut next_hp = hp + heal;
        if (next_hp > max_hp) {
            next_hp = max_hp;
        };
        hunter::set_hp(hunter, next_hp);
        hunter::sub_herb_count(hunter, 1);
        inventory::destroy_herb(herb);
    }

    public fun take_damage_with_session(
        key: &SessionKey,
        hunter: &mut Hunter,
        damage: u64,
        virus_state: &VirusState,
        ctx: &mut TxContext,
    ) {
        session_key::assert_valid(key, sui::tx_context::epoch(ctx));
        take_damage(hunter, damage, virus_state);
    }

    public fun take_damage(hunter: &mut Hunter, damage: u64, virus_state: &VirusState) {
        let hp = hunter::hp(hunter);
        let next_hp = if (damage >= hp) 0 else hp - damage;
        hunter::set_hp(hunter, next_hp);

        let infection_added = virus_state::get_infection_rate(virus_state) / 10;
        hunter::add_infection(hunter, infection_added);

        event::emit(DamageEvent {
            hunter_id: hunter::object_id(hunter),
            damage,
            infection_added,
        });
    }

    #[test]
    fun test_small_zombie_kill_sequence() {
        let mut ctx = sui::tx_context::dummy();
        let (mut virus, cap) = virus_state::new_for_testing(&mut ctx);
        virus_state::increase_infection(&cap, &mut virus, 20, 1);

        let mut hunter_obj = hunter::create_hunter_for_testing(2, &mut ctx);
        let mut ammo = inventory::new_ammo_for_testing(0, 3, &mut ctx);

        let mut spawn_rng = random::new_generator_from_seed_for_testing(x"0101010101010101");
        let mut z = zombie::spawn_small(777, &virus, &mut spawn_rng);

        let mut fight_rng = random::new_generator_from_seed_for_testing(x"ffffffffffffffff");
        attack_small(&cap, &mut hunter_obj, &mut z, &mut ammo, &mut virus, &mut fight_rng, &mut ctx);

        let (_, _, _, _, _, kills, _) = hunter::get_stats(&hunter_obj);
        assert!(inventory::ammo_count(&ammo) == 2, E_NO_AMMO + 10);
        assert!(zombie::is_dead_small(&z), E_NO_AMMO + 11);
        assert!(kills == 1, E_NO_AMMO + 12);
        assert!(virus_state::get_infection_rate(&virus) == 19, E_NO_AMMO + 13);

        inventory::destroy_ammo(ammo);
        while (inventory::count_fragments(&hunter_obj) > 0) {
            let fragment = inventory::pop_one_fragment(&mut hunter_obj);
            inventory::destroy_fragment(fragment);
        };
        hunter::destroy_for_testing(hunter_obj);
        virus_state::destroy_for_testing(virus, cap);
    }
}

