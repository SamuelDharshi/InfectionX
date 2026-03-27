module resident_system::hunter {
    use std::option::{Self, Option};
    use std::vector;

    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    const E_INVALID_CLASS: u64 = 0;

    const CLASS_POINTMAN: u8 = 0;
    const CLASS_MEDIC: u8 = 1;
    const CLASS_SHARPSHOOTER: u8 = 2;

    public struct Hunter has key {
        id: UID,
        owner: address,
        class: u8,
        hp: u64,
        max_hp: u64,
        infection_level: u64,
        kills: u64,
        badge_id: Option<ID>,
        crit_modifier: u64,
        herb_count: u64,
        ammo_count: u64,
        fragment_count: u64,
        fragment_item_ids: vector<ID>,
    }

    public entry fun create_hunter(class: u8, ctx: &mut TxContext) {
        let hunter = create_hunter_internal(class, ctx);
        transfer::transfer(hunter, tx_context::sender(ctx));
    }

    public fun get_stats(hunter: &Hunter): (address, u8, u64, u64, u64, u64, u64) {
        (
            hunter.owner,
            hunter.class,
            hunter.hp,
            hunter.max_hp,
            hunter.infection_level,
            hunter.kills,
            hunter.crit_modifier,
        )
    }

    public fun get_inventory_counts(hunter: &Hunter): (u64, u64, u64) {
        (hunter.herb_count, hunter.ammo_count, hunter.fragment_count)
    }

    #[test_only]
    public fun create_hunter_for_testing(class: u8, ctx: &mut TxContext): Hunter {
        create_hunter_internal(class, ctx)
    }

    #[test_only]
    public fun destroy_for_testing(hunter: Hunter) {
        let Hunter {
            id,
            owner: _,
            class: _,
            hp: _,
            max_hp: _,
            infection_level: _,
            kills: _,
            badge_id: _,
            crit_modifier: _,
            herb_count: _,
            ammo_count: _,
            fragment_count: _,
            fragment_item_ids: _,
        } = hunter;
        object::delete(id);
    }

    fun create_hunter_internal(class: u8, ctx: &mut TxContext): Hunter {
        let owner = tx_context::sender(ctx);
        let (max_hp, crit_modifier) = base_stats(class);

        Hunter {
            id: object::new(ctx),
            owner,
            class,
            hp: max_hp,
            max_hp,
            infection_level: 0,
            kills: 0,
            badge_id: option::none(),
            crit_modifier,
            herb_count: 0,
            ammo_count: 0,
            fragment_count: 0,
            fragment_item_ids: vector[],
        }
    }

    public(package) fun uid_mut(hunter: &mut Hunter): &mut UID {
        &mut hunter.id
    }

    public(package) fun uid(hunter: &Hunter): &UID {
        &hunter.id
    }

    public(package) fun object_id(hunter: &Hunter): ID {
        object::id(hunter)
    }

    public(package) fun class(hunter: &Hunter): u8 {
        hunter.class
    }

    public(package) fun owner(hunter: &Hunter): address {
        hunter.owner
    }

    public(package) fun crit_modifier(hunter: &Hunter): u64 {
        hunter.crit_modifier
    }

    public(package) fun hp(hunter: &Hunter): u64 {
        hunter.hp
    }

    public(package) fun max_hp(hunter: &Hunter): u64 {
        hunter.max_hp
    }

    public(package) fun add_kill(hunter: &mut Hunter, amount: u64) {
        hunter.kills = hunter.kills + amount;
    }

    public(package) fun set_hp(hunter: &mut Hunter, new_hp: u64) {
        hunter.hp = new_hp;
    }

    public(package) fun add_infection(hunter: &mut Hunter, amount: u64) {
        let mut next = hunter.infection_level + amount;
        if (next > 100) {
            next = 100;
        };
        hunter.infection_level = next;
    }

    public(package) fun add_herb_count(hunter: &mut Hunter, amount: u64) {
        hunter.herb_count = hunter.herb_count + amount;
    }

    public(package) fun sub_herb_count(hunter: &mut Hunter, amount: u64) {
        if (amount >= hunter.herb_count) {
            hunter.herb_count = 0;
        } else {
            hunter.herb_count = hunter.herb_count - amount;
        }
    }

    public(package) fun add_ammo_count(hunter: &mut Hunter, amount: u64) {
        hunter.ammo_count = hunter.ammo_count + amount;
    }

    public(package) fun sub_ammo_count(hunter: &mut Hunter, amount: u64) {
        if (amount >= hunter.ammo_count) {
            hunter.ammo_count = 0;
        } else {
            hunter.ammo_count = hunter.ammo_count - amount;
        }
    }

    public(package) fun add_fragment_count(hunter: &mut Hunter, amount: u64) {
        hunter.fragment_count = hunter.fragment_count + amount;
    }

    public(package) fun sub_fragment_count(hunter: &mut Hunter, amount: u64) {
        if (amount >= hunter.fragment_count) {
            hunter.fragment_count = 0;
        } else {
            hunter.fragment_count = hunter.fragment_count - amount;
        }
    }

    public(package) fun add_fragment_item_id(hunter: &mut Hunter, item_id: ID) {
        vector::push_back(&mut hunter.fragment_item_ids, item_id);
    }

    public(package) fun pop_fragment_item_id(hunter: &mut Hunter): ID {
        vector::pop_back(&mut hunter.fragment_item_ids)
    }

    public(package) fun remove_fragment_item_id(hunter: &mut Hunter, item_id: ID) {
        let mut i = 0;
        let len = vector::length(&hunter.fragment_item_ids);
        while (i < len) {
            if (*vector::borrow(&hunter.fragment_item_ids, i) == item_id) {
                vector::swap_remove(&mut hunter.fragment_item_ids, i);
                return
            };
            i = i + 1;
        };
    }

    public(package) fun set_badge_id(hunter: &mut Hunter, badge_id: ID) {
        hunter.badge_id = option::some(badge_id);
    }

    public(package) fun has_badge(hunter: &Hunter): bool {
        option::is_some(&hunter.badge_id)
    }

    fun base_stats(class: u8): (u64, u64) {
        if (class == CLASS_POINTMAN) {
            (220, 100)
        } else if (class == CLASS_MEDIC) {
            (180, 100)
        } else if (class == CLASS_SHARPSHOOTER) {
            (150, 150)
        } else {
            abort E_INVALID_CLASS
        }
    }

    #[test]
    fun test_class_base_stats_differ() {
        let mut p_ctx = tx_context::dummy();
        let pointman = create_hunter_for_testing(CLASS_POINTMAN, &mut p_ctx);

        let mut m_ctx = tx_context::dummy();
        let medic = create_hunter_for_testing(CLASS_MEDIC, &mut m_ctx);

        let mut s_ctx = tx_context::dummy();
        let sharpshooter = create_hunter_for_testing(CLASS_SHARPSHOOTER, &mut s_ctx);

        assert!(pointman.max_hp > medic.max_hp, E_INVALID_CLASS);
        assert!(medic.max_hp > sharpshooter.max_hp, E_INVALID_CLASS);
        assert!(sharpshooter.crit_modifier > pointman.crit_modifier, E_INVALID_CLASS);
        assert!(sharpshooter.crit_modifier > medic.crit_modifier, E_INVALID_CLASS);

        destroy_for_testing(pointman);
        destroy_for_testing(medic);
        destroy_for_testing(sharpshooter);
    }
}

