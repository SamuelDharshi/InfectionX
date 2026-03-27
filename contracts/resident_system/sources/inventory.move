module resident_system::inventory {
    use sui::dynamic_field;
    use sui::object::{Self, ID, UID};
    use sui::tx_context::{Self, TxContext};

    use resident_system::hunter::{Self, Hunter};

    const E_ITEM_NOT_FOUND: u64 = 0;

    const ITEM_GREEN_HERB: u8 = 1;
    const ITEM_AMMO: u8 = 2;
    const ITEM_VACCINE_FRAGMENT: u8 = 3;

    public struct InventoryItemKey has copy, drop, store {
        item_id: ID,
    }

    public struct GreenHerb has key, store {
        id: UID,
        heal_amount: u64,
    }

    public struct Ammo has key, store {
        id: UID,
        weapon_type: u8,
        count: u64,
    }

    public struct VaccineFragment has key, store {
        id: UID,
        fragment_id: u64,
        area_origin: u64,
    }

    #[test_only]
    public fun new_green_herb_for_testing(heal_amount: u64, ctx: &mut TxContext): GreenHerb {
        GreenHerb { id: object::new(ctx), heal_amount }
    }

    #[test_only]
    public fun new_ammo_for_testing(weapon_type: u8, count: u64, ctx: &mut TxContext): Ammo {
        Ammo {
            id: object::new(ctx),
            weapon_type,
            count,
        }
    }

    #[test_only]
    public fun new_fragment_for_testing(fragment_id: u64, area_origin: u64, ctx: &mut TxContext): VaccineFragment {
        mint_fragment(fragment_id, area_origin, ctx)
    }

    public(package) fun mint_fragment(fragment_id: u64, area_origin: u64, ctx: &mut TxContext): VaccineFragment {
        VaccineFragment {
            id: object::new(ctx),
            fragment_id,
            area_origin,
        }
    }

    public fun add_to_inventory<T: key + store>(hunter: &mut Hunter, item: T) {
        let key = InventoryItemKey { item_id: object::id(&item) };
        dynamic_field::add(hunter::uid_mut(hunter), key, item);
    }

    public fun add_to_inventory_green_herb(hunter: &mut Hunter, item: GreenHerb) {
        add_to_inventory(hunter, item);
        hunter::add_herb_count(hunter, 1);
    }

    public fun add_to_inventory_ammo(hunter: &mut Hunter, item: Ammo) {
        add_to_inventory(hunter, item);
        hunter::add_ammo_count(hunter, 1);
    }

    public fun add_to_inventory_fragment(hunter: &mut Hunter, item: VaccineFragment) {
        let item_id = object::id(&item);
        add_to_inventory(hunter, item);
        hunter::add_fragment_count(hunter, 1);
        hunter::add_fragment_item_id(hunter, item_id);
    }

    public fun remove_from_inventory<T: key + store>(hunter: &mut Hunter, item_id: ID): T {
        let key = InventoryItemKey { item_id };
        dynamic_field::remove<InventoryItemKey, T>(hunter::uid_mut(hunter), key)
    }

    public fun remove_from_inventory_any(hunter: &mut Hunter, item_id: ID): bool {
        let key = InventoryItemKey { item_id };
        if (dynamic_field::exists_with_type<InventoryItemKey, GreenHerb>(hunter::uid(hunter), key)) {
            let herb = remove_from_inventory_green_herb(hunter, item_id);
            destroy_herb(herb);
            true
        } else if (dynamic_field::exists_with_type<InventoryItemKey, Ammo>(hunter::uid(hunter), key)) {
            let ammo = remove_from_inventory_ammo(hunter, item_id);
            destroy_ammo(ammo);
            true
        } else if (dynamic_field::exists_with_type<InventoryItemKey, VaccineFragment>(hunter::uid(hunter), key)) {
            let fragment = remove_from_inventory_fragment(hunter, item_id);
            destroy_fragment(fragment);
            true
        } else {
            false
        }
    }

    public fun remove_from_inventory_green_herb(hunter: &mut Hunter, item_id: ID): GreenHerb {
        let key = InventoryItemKey { item_id };
        assert!(dynamic_field::exists_with_type<InventoryItemKey, GreenHerb>(hunter::uid(hunter), key), E_ITEM_NOT_FOUND);
        let item = remove_from_inventory<GreenHerb>(hunter, item_id);
        hunter::sub_herb_count(hunter, 1);
        item
    }

    public fun remove_from_inventory_ammo(hunter: &mut Hunter, item_id: ID): Ammo {
        let key = InventoryItemKey { item_id };
        assert!(dynamic_field::exists_with_type<InventoryItemKey, Ammo>(hunter::uid(hunter), key), E_ITEM_NOT_FOUND);
        let item = remove_from_inventory<Ammo>(hunter, item_id);
        hunter::sub_ammo_count(hunter, 1);
        item
    }

    public fun remove_from_inventory_fragment(hunter: &mut Hunter, item_id: ID): VaccineFragment {
        let key = InventoryItemKey { item_id };
        assert!(
            dynamic_field::exists_with_type<InventoryItemKey, VaccineFragment>(hunter::uid(hunter), key),
            E_ITEM_NOT_FOUND,
        );
        let item = remove_from_inventory<VaccineFragment>(hunter, item_id);
        hunter::sub_fragment_count(hunter, 1);
        hunter::remove_fragment_item_id(hunter, item_id);
        item
    }

    public(package) fun pop_one_fragment(hunter: &mut Hunter): VaccineFragment {
        let item_id = hunter::pop_fragment_item_id(hunter);
        let item = remove_from_inventory<VaccineFragment>(hunter, item_id);
        hunter::sub_fragment_count(hunter, 1);
        item
    }

    public fun count_fragments(hunter: &Hunter): u64 {
        let (_, _, fragments) = hunter::get_inventory_counts(hunter);
        fragments
    }

    public fun item_id_green_herb(item: &GreenHerb): ID {
        object::id(item)
    }

    public fun item_id_ammo(item: &Ammo): ID {
        object::id(item)
    }

    public fun item_kind_green_herb(_item: &GreenHerb): u8 {
        ITEM_GREEN_HERB
    }

    public fun item_kind_ammo(_item: &Ammo): u8 {
        ITEM_AMMO
    }

    public fun item_kind_fragment(_item: &VaccineFragment): u8 {
        ITEM_VACCINE_FRAGMENT
    }

    public fun ammo_count(ammo: &Ammo): u64 {
        ammo.count
    }

    public(package) fun consume_one_ammo(ammo: &mut Ammo) {
        if (ammo.count > 0) {
            ammo.count = ammo.count - 1;
        }
    }

    public fun heal_amount(herb: &GreenHerb): u64 {
        herb.heal_amount
    }

    public(package) fun destroy_herb(item: GreenHerb) {
        let GreenHerb { id, heal_amount: _ } = item;
        object::delete(id);
    }

    public(package) fun destroy_ammo(item: Ammo) {
        let Ammo {
            id,
            weapon_type: _,
            count: _,
        } = item;
        object::delete(id);
    }

    public(package) fun destroy_fragment(item: VaccineFragment) {
        let VaccineFragment {
            id,
            fragment_id: _,
            area_origin: _,
        } = item;
        object::delete(id);
    }

    #[test]
    fun test_inventory_add_remove_counts() {
        let mut ctx = tx_context::dummy();
        let mut h = hunter::create_hunter_for_testing(0, &mut ctx);

        let herb1 = new_green_herb_for_testing(25, &mut ctx);
        let herb2 = new_green_herb_for_testing(30, &mut ctx);
        let herb3 = new_green_herb_for_testing(40, &mut ctx);
        let ammo1 = new_ammo_for_testing(0, 12, &mut ctx);
        let ammo2 = new_ammo_for_testing(1, 5, &mut ctx);

        let herb1_id = object::id(&herb1);
        let herb2_id = object::id(&herb2);
        let herb3_id = object::id(&herb3);
        let ammo1_id = object::id(&ammo1);
        let ammo2_id = object::id(&ammo2);

        add_to_inventory_green_herb(&mut h, herb1);
        add_to_inventory_green_herb(&mut h, herb2);
        add_to_inventory_green_herb(&mut h, herb3);
        add_to_inventory_ammo(&mut h, ammo1);
        add_to_inventory_ammo(&mut h, ammo2);

        assert!(count_fragments(&h) == 0, E_ITEM_NOT_FOUND + 1);

        let removed = remove_from_inventory_green_herb(&mut h, herb1_id);
        let (herbs, ammo, fragments) = hunter::get_inventory_counts(&h);
        assert!(herbs == 2, E_ITEM_NOT_FOUND + 2);
        assert!(ammo == 2, E_ITEM_NOT_FOUND + 3);
        assert!(fragments == 0, E_ITEM_NOT_FOUND + 4);

        destroy_herb(removed);
        destroy_herb(remove_from_inventory_green_herb(&mut h, herb2_id));
        destroy_herb(remove_from_inventory_green_herb(&mut h, herb3_id));
        destroy_ammo(remove_from_inventory_ammo(&mut h, ammo1_id));
        destroy_ammo(remove_from_inventory_ammo(&mut h, ammo2_id));
        hunter::destroy_for_testing(h);
    }
}

