module resident_system::virus_state {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    const E_INVALID_CLASS: u64 = 0;
    const MAX_INFECTION_RATE: u64 = 100;

    public struct VirusState has key {
        id: UID,
        infection_rate: u64,
        total_kills: u64,
        last_updated_epoch: u64,
    }

    /// Capability required to mutate global infection state.
    /// This is minted once at publish and can be retained by contract-owned flows.
    public struct InfectionControlCap has key {
        id: UID,
    }

    fun init(ctx: &mut TxContext) {
        let state = VirusState {
            id: object::new(ctx),
            infection_rate: 0,
            total_kills: 0,
            last_updated_epoch: tx_context::epoch(ctx),
        };

        let cap = InfectionControlCap {
            id: object::new(ctx),
        };

        transfer::share_object(state);
        transfer::transfer(cap, tx_context::sender(ctx));
    }

    public fun get_infection_rate(state: &VirusState): u64 {
        state.infection_rate
    }

    public(package) fun increase_infection(
        _cap: &InfectionControlCap,
        state: &mut VirusState,
        rate_delta: u64,
        current_epoch: u64,
    ) {
        let mut next = state.infection_rate + rate_delta;
        if (next > MAX_INFECTION_RATE) {
            next = MAX_INFECTION_RATE;
        };

        state.infection_rate = next;
        state.last_updated_epoch = current_epoch;
    }

    public(package) fun decrease_infection(
        _cap: &InfectionControlCap,
        state: &mut VirusState,
        rate_delta: u64,
        current_epoch: u64,
    ) {
        decrease_infection_internal(state, rate_delta, current_epoch);
    }

    public(package) fun decrease_infection_internal(
        state: &mut VirusState,
        rate_delta: u64,
        current_epoch: u64,
    ) {
        if (rate_delta >= state.infection_rate) {
            state.infection_rate = 0;
        } else {
            state.infection_rate = state.infection_rate - rate_delta;
        };

        state.last_updated_epoch = current_epoch;
    }

    public(package) fun add_total_kills(
        _cap: &InfectionControlCap,
        state: &mut VirusState,
        amount: u64,
        current_epoch: u64,
    ) {
        state.total_kills = state.total_kills + amount;
        state.last_updated_epoch = current_epoch;
    }

    #[test_only]
    public fun new_for_testing(ctx: &mut TxContext): (VirusState, InfectionControlCap) {
        (
            VirusState {
                id: object::new(ctx),
                infection_rate: 0,
                total_kills: 0,
                last_updated_epoch: tx_context::epoch(ctx),
            },
            InfectionControlCap {
                id: object::new(ctx),
            },
        )
    }

    #[test_only]
    public fun destroy_for_testing(state: VirusState, cap: InfectionControlCap) {
        let VirusState {
            id,
            infection_rate: _,
            total_kills: _,
            last_updated_epoch: _,
        } = state;
        let InfectionControlCap { id: cap_id } = cap;
        object::delete(id);
        object::delete(cap_id);
    }

    #[test]
    fun test_infection_rate_bounds() {
        let mut ctx = tx_context::dummy();
        let (mut state, cap) = new_for_testing(&mut ctx);

        increase_infection(&cap, &mut state, 200, 1);
        assert!(state.infection_rate == 100, E_INVALID_CLASS);

        decrease_infection(&cap, &mut state, 150, 2);
        assert!(state.infection_rate == 0, E_INVALID_CLASS);

        destroy_for_testing(state, cap);
    }
}

