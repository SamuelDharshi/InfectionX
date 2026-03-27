module resident_system::raid {
    use std::vector;

    use sui::event;
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use resident_system::hunter::{Self, Hunter};
    use resident_system::inventory;
    use resident_system::virus_state::{Self, VirusState};
    use resident_system::zombie::{Self, BigZombie};

    const E_ALREADY_JOINED: u64 = 0;
    const E_NOT_PARTICIPANT: u64 = 1;
    const E_NOT_READY: u64 = 2;
    const E_NOT_ENOUGH_PARTICIPANTS: u64 = 3;
    const E_INACTIVE_LOBBY: u64 = 4;
    const E_HUNTER_OWNER_MISMATCH: u64 = 5;

    public struct RaidLobby has key {
        id: UID,
        boss_id: ID,
        participants: vector<address>,
        required: u8,
        ready_flags: vector<bool>,
        active: bool,
    }

    public struct BossKilledEvent has copy, drop {
        area_id: u64,
        participants: vector<address>,
        fragments_distributed: u64,
    }

    public entry fun create_lobby(boss: &BigZombie, ctx: &mut TxContext) {
        let lobby = RaidLobby {
            id: object::new(ctx),
            boss_id: zombie::object_id_big(boss),
            participants: vector[],
            required: zombie::required_officers(boss),
            ready_flags: vector[],
            active: true,
        };
        transfer::share_object(lobby);
    }

    #[test_only]
    public fun create_lobby_for_testing(boss: &BigZombie, ctx: &mut TxContext): RaidLobby {
        RaidLobby {
            id: object::new(ctx),
            boss_id: zombie::object_id_big(boss),
            participants: vector[],
            required: zombie::required_officers(boss),
            ready_flags: vector[],
            active: true,
        }
    }

    #[test_only]
    public fun destroy_for_testing(lobby: RaidLobby) {
        let RaidLobby {
            id,
            boss_id: _,
            participants: _,
            required: _,
            ready_flags: _,
            active: _,
        } = lobby;
        object::delete(id);
    }

    public fun join_raid(lobby: &mut RaidLobby, hunter: &Hunter, ctx: &TxContext) {
        assert!(lobby.active, E_INACTIVE_LOBBY);
        let sender = tx_context::sender(ctx);
        assert!(hunter::owner(hunter) == sender, E_HUNTER_OWNER_MISMATCH);

        let mut i = 0;
        let len = vector::length(&lobby.participants);
        while (i < len) {
            assert!(*vector::borrow(&lobby.participants, i) != sender, E_ALREADY_JOINED);
            i = i + 1;
        };

        vector::push_back(&mut lobby.participants, sender);
        vector::push_back(&mut lobby.ready_flags, false);
    }

    public fun ready_up(lobby: &mut RaidLobby, ctx: &TxContext) {
        assert!(lobby.active, E_INACTIVE_LOBBY);
        let sender = tx_context::sender(ctx);

        let mut i = 0;
        let len = vector::length(&lobby.participants);
        while (i < len) {
            if (*vector::borrow(&lobby.participants, i) == sender) {
                *vector::borrow_mut(&mut lobby.ready_flags, i) = true;
                return
            };
            i = i + 1;
        };

        abort E_NOT_PARTICIPANT
    }

    public fun execute_raid(
        lobby: &mut RaidLobby,
        boss: &mut BigZombie,
        hunters: &mut vector<Hunter>,
        virus_state: &mut VirusState,
        ctx: &mut TxContext,
    ) {
        assert!(lobby.active, E_INACTIVE_LOBBY);

        let participants_len = vector::length(&lobby.participants);
        assert!(participants_len >= (zombie::required_officers(boss) as u64), E_NOT_ENOUGH_PARTICIPANTS);

        let mut i = 0;
        let ready_len = vector::length(&lobby.ready_flags);
        while (i < ready_len) {
            assert!(*vector::borrow(&lobby.ready_flags, i), E_NOT_READY);
            i = i + 1;
        };

        let mut combined_damage = 0;
        let mut j = 0;
        let hunters_len = vector::length(hunters);
        while (j < hunters_len) {
            let h = vector::borrow(hunters, j);
            combined_damage = combined_damage + hunter::crit_modifier(h);
            j = j + 1;
        };

        zombie::apply_damage_big(boss, combined_damage);

        if (zombie::is_dead_big(boss)) {
            let mut fragments_distributed = 0;
            let drops_each = zombie::vaccine_fragments(boss);

            let mut p = 0;
            while (p < hunters_len) {
                let h = vector::borrow_mut(hunters, p);

                let mut d = 0;
                while (d < drops_each) {
                    let fragment = inventory::mint_fragment(
                        zombie::area_id_big(boss) * 10000 + p * 100 + d,
                        zombie::area_id_big(boss),
                        ctx,
                    );
                    inventory::add_to_inventory_fragment(h, fragment);
                    fragments_distributed = fragments_distributed + 1;
                    d = d + 1;
                };

                p = p + 1;
            };

            virus_state::decrease_infection_internal(virus_state, 10, tx_context::epoch(ctx));
            lobby.active = false;

            let mut participants_copy = vector[];
            let mut k = 0;
            while (k < participants_len) {
                vector::push_back(&mut participants_copy, *vector::borrow(&lobby.participants, k));
                k = k + 1;
            };

            event::emit(BossKilledEvent {
                area_id: zombie::area_id_big(boss),
                participants: participants_copy,
                fragments_distributed,
            });
        };
    }

    #[test]
    fun test_execute_raid_multi_participant_kill() {
        let mut admin_ctx = tx_context::new_from_hint(@0xA, 0, 0, 0, 0);
        let (mut state, cap) = virus_state::new_for_testing(&mut admin_ctx);
        virus_state::increase_infection(&cap, &mut state, 30, tx_context::epoch(&admin_ctx));

        let mut boss = zombie::spawn_big_for_testing(9, 2500, 2, 2, &mut admin_ctx);
        let mut lobby = create_lobby_for_testing(&boss, &mut admin_ctx);

        lobby.participants = vector[@0x1, @0x2, @0x3, @0x4];
        lobby.ready_flags = vector[true, true, true, true];

        let h1 = hunter::create_hunter_for_testing(1, &mut admin_ctx);
        let h2 = hunter::create_hunter_for_testing(1, &mut admin_ctx);
        let h3 = hunter::create_hunter_for_testing(1, &mut admin_ctx);
        let h4 = hunter::create_hunter_for_testing(1, &mut admin_ctx);

        let mut hunters = vector[h1, h2, h3, h4];
        while (!zombie::is_dead_big(&boss)) {
            execute_raid(&mut lobby, &mut boss, &mut hunters, &mut state, &mut admin_ctx);
        };

        assert!(!lobby.active, E_INACTIVE_LOBBY + 100);
        assert!(virus_state::get_infection_rate(&state) == 20, E_INACTIVE_LOBBY + 101);

        let mut i = 0;
        let len = vector::length(&hunters);
        while (i < len) {
            let h = vector::borrow_mut(&mut hunters, i);
            while (inventory::count_fragments(h) > 0) {
                let fragment = inventory::pop_one_fragment(h);
                inventory::destroy_fragment(fragment);
            };
            i = i + 1;
        };

        while (vector::length(&hunters) > 0) {
            let h = vector::pop_back(&mut hunters);
            hunter::destroy_for_testing(h);
        };
        vector::destroy_empty(hunters);

        destroy_for_testing(lobby);
        zombie::destroy_big_for_testing(boss);
        virus_state::destroy_for_testing(state, cap);
    }
}

