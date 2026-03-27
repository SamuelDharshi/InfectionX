module resident_system::survival {
    use sui::event;
    use sui::object::ID;
    use sui::random;

    use resident_system::hunter::{Self, Hunter};
    use resident_system::inventory::{Self, Ammo, GreenHerb};
    use resident_system::session_key::{Self, SessionKey};
    use resident_system::virus_state::{Self, VirusState};
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

    public entry fun attack_small_entry(
        hunter: &mut Hunter,
        zombie: &mut SmallZombie,
        ammo: &mut Ammo,
        virus_state: &mut VirusState,
        random_obj: &random::Random,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        let mut rng = random::new_generator(random_obj, ctx);
        attack_small(hunter, zombie, ammo, virus_state, &mut rng, ctx);
    }

    public entry fun attack_small_with_session(
        key: &SessionKey,
        hunter: &mut Hunter,
        zombie: &mut SmallZombie,
        ammo: &mut Ammo,
        virus_state: &mut VirusState,
        random_obj: &random::Random,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        session_key::assert_valid(key, sui::tx_context::epoch(ctx));
        attack_small_entry(hunter, zombie, ammo, virus_state, random_obj, ctx);
    }

    public fun attack_small(
        hunter: &mut Hunter,
        zombie: &mut SmallZombie,
        ammo: &mut Ammo,
        virus_state: &mut VirusState,
        rng: &mut random::RandomGenerator,
        ctx: &mut sui::tx_context::TxContext,
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
            virus_state::decrease_infection(virus_state, 1, sui::tx_context::epoch(ctx));
            virus_state::add_total_kills(virus_state, 1, sui::tx_context::epoch(ctx));

            let frag_id = (zombie::entity_id_small(zombie) % 1000) as u64;
            let fragment = inventory::mint_fragment(
                frag_id,
                1, // Default area
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
        ctx: &sui::tx_context::TxContext,
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
        // Note: remove_from_inventory_green_herb already calls sub_herb_count
        inventory::destroy_herb(herb);
    }

    public entry fun use_herb_entry(
        hunter: &mut Hunter,
        herb_id: sui::object::ID,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        let herb = inventory::remove_from_inventory_green_herb(hunter, herb_id);
        use_herb(hunter, herb);
    }

    public fun take_damage_with_session(
        key: &SessionKey,
        hunter: &mut Hunter,
        damage: u64,
        virus_state: &VirusState,
        ctx: &mut sui::tx_context::TxContext,
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
        let mut ctx = sui::tx_context::new_from_hint(@0xAB, 0, 0, 0, 0);
        let (mut virus, cap) = virus_state::new_for_testing(&mut ctx);
        virus_state::increase_infection(&mut virus, 20, 1);

        let mut hunter_obj = hunter::create_hunter_for_testing(2, &mut ctx);
        let mut ammo = inventory::new_ammo_for_testing(0, 3, &mut ctx);

        let mut spawn_rng = random::new_generator_from_seed_for_testing(x"0101010101010101");
        let mut z = zombie::spawn_small(777, &virus, &mut spawn_rng, &mut ctx);

        let mut fight_rng = random::new_generator_from_seed_for_testing(x"ffffffffffffffff");
        attack_small(&mut hunter_obj, &mut z, &mut ammo, &mut virus, &mut fight_rng, &mut ctx);

        let (_, _, hp, _, _, kills, _) = hunter::get_stats(&hunter_obj);
        assert!(inventory::ammo_count(&ammo) == 2, E_NO_AMMO + 10);
        assert!(zombie::is_dead_small(&z), E_NO_AMMO + 11);
        assert!(kills == 1, E_NO_AMMO + 12);
        assert!(virus_state::get_infection_rate(&virus) == 19, E_NO_AMMO + 13);

        inventory::destroy_ammo(ammo);
        while (inventory::count_fragments(&hunter_obj) > 0) {
            let fragment = inventory::pop_one_fragment(&mut hunter_obj);
            inventory::destroy_fragment(fragment);
        };
        zombie::destroy_small(z);
        hunter::destroy_for_testing(hunter_obj);
        virus_state::destroy_for_testing(virus, cap);
    }
}
