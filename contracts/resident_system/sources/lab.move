module resident_system::lab {
    use std::string;
    use std::vector;

    use sui::display;
    use sui::event;
    use sui::object::{Self, ID, UID};
    use sui::package;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use resident_system::hunter::{Self, Hunter};
    use resident_system::inventory;

    const E_NEED_TEN_FRAGMENTS: u64 = 0;

    public struct LAB has drop {}

    public struct Lab has key {
        id: UID,
        area_id: u64,
        cures_minted: u64,
    }

    public struct SurvivorBadge has key, store {
        id: UID,
        owner: address,
        area_id: u64,
        minted_at: u64,
        cure_number: u64,
    }

    public struct CureMintedEvent has copy, drop {
        owner: address,
        area_id: u64,
        cure_number: u64,
        badge_id: ID,
    }

    fun init(otw: LAB, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);

        let mut fields = vector[];
        vector::push_back(&mut fields, string::utf8(b"name"));
        vector::push_back(&mut fields, string::utf8(b"description"));
        vector::push_back(&mut fields, string::utf8(b"image_url"));

        let mut values = vector[];
        vector::push_back(&mut values, string::utf8(b"Survivor Badge #{cure_number}"));
        vector::push_back(&mut values, string::utf8(b"Area {area_id} cure issued to {owner}"));
        vector::push_back(&mut values, string::utf8(b"https://resident.system/badge/{id}"));

        let display = display::new_with_fields<SurvivorBadge>(&publisher, fields, values, ctx);
        transfer::public_transfer(display, tx_context::sender(ctx));
        transfer::public_transfer(publisher, tx_context::sender(ctx));
    }

    public fun create_lab(area_id: u64, ctx: &mut TxContext) {
        let lab = Lab {
            id: object::new(ctx),
            area_id,
            cures_minted: 0,
        };
        transfer::share_object(lab);
    }

    #[test_only]
    public fun create_lab_for_testing(area_id: u64, ctx: &mut TxContext): Lab {
        Lab {
            id: object::new(ctx),
            area_id,
            cures_minted: 0,
        }
    }

    #[test_only]
    public fun destroy_for_testing(lab: Lab) {
        let Lab {
            id,
            area_id: _,
            cures_minted: _,
        } = lab;
        object::delete(id);
    }

    public fun combine_fragments(lab: &mut Lab, hunter: &mut Hunter, ctx: &mut TxContext) {
        assert!(inventory::count_fragments(hunter) == 10, E_NEED_TEN_FRAGMENTS);

        let mut i = 0;
        while (i < 10) {
            let fragment = inventory::pop_one_fragment(hunter);
            inventory::destroy_fragment(fragment);
            i = i + 1;
        };

        lab.cures_minted = lab.cures_minted + 1;
        let owner = hunter::owner(hunter);
        let badge = SurvivorBadge {
            id: object::new(ctx),
            owner,
            area_id: lab.area_id,
            minted_at: tx_context::epoch(ctx),
            cure_number: lab.cures_minted,
        };

        let badge_id = object::id(&badge);
        hunter::set_badge_id(hunter, badge_id);
        transfer::transfer(badge, owner);

        event::emit(CureMintedEvent {
            owner,
            area_id: lab.area_id,
            cure_number: lab.cures_minted,
            badge_id,
        });
    }

    #[test]
    fun test_combine_fragments_mints_badge() {
        let mut ctx = tx_context::dummy();
        let mut hunter_obj = hunter::create_hunter_for_testing(1, &mut ctx);
        let mut lab = create_lab_for_testing(42, &mut ctx);

        let mut i = 0;
        while (i < 10) {
            let fragment = inventory::new_fragment_for_testing(i, 42, &mut ctx);
            inventory::add_to_inventory_fragment(&mut hunter_obj, fragment);
            i = i + 1;
        };

        combine_fragments(&mut lab, &mut hunter_obj, &mut ctx);
        assert!(inventory::count_fragments(&hunter_obj) == 0, E_NEED_TEN_FRAGMENTS + 1);
        assert!(hunter::has_badge(&hunter_obj), E_NEED_TEN_FRAGMENTS + 2);

        hunter::destroy_for_testing(hunter_obj);
        destroy_for_testing(lab);
    }
}

