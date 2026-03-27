module resident_system::session_key {
    use std::string::String;
    use std::string;
    use std::vector;

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    const E_SESSION_EXPIRED: u64 = 0;
    const E_DURATION_ZERO: u64 = 1;

    const EPOCHS_FOR_TEN_MINUTES: u64 = 1;

    public struct SessionKey has key, store {
        id: UID,
        owner: address,
        expires_at_epoch: u64,
        allowed_modules: vector<String>,
    }

    public entry fun create_session(duration_epochs: u64, ctx: &mut TxContext) {
        let key = create_session_internal(duration_epochs, ctx);
        transfer::public_transfer(key, tx_context::sender(ctx));
    }

    #[test_only]
    public fun create_session_for_testing(duration_epochs: u64, ctx: &mut TxContext): SessionKey {
        create_session_internal(duration_epochs, ctx)
    }

    fun create_session_internal(duration_epochs: u64, ctx: &mut TxContext): SessionKey {
        assert!(duration_epochs > 0, E_DURATION_ZERO);

        let mut allowed_modules = vector[];
        vector::push_back(&mut allowed_modules, string::utf8(b"survival"));

        SessionKey {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            expires_at_epoch: tx_context::epoch(ctx) + (duration_epochs * EPOCHS_FOR_TEN_MINUTES),
            allowed_modules,
        }
    }

    #[test_only]
    public fun destroy_for_testing(key: SessionKey) {
        let SessionKey {
            id,
            owner: _,
            expires_at_epoch: _,
            allowed_modules: _,
        } = key;
        object::delete(id);
    }

    public fun is_valid(key: &SessionKey, current_epoch: u64): bool {
        current_epoch <= key.expires_at_epoch
    }

    public(package) fun assert_valid(key: &SessionKey, current_epoch: u64) {
        assert!(is_valid(key, current_epoch), E_SESSION_EXPIRED);
    }

    #[test]
    fun test_session_validity_window() {
        let mut ctx = tx_context::dummy();
        let key = create_session_for_testing(1, &mut ctx);
        let now = tx_context::epoch(&ctx);

        assert!(is_valid(&key, now), E_SESSION_EXPIRED + 10);
        assert!(!is_valid(&key, now + 2), E_SESSION_EXPIRED + 11);

        destroy_for_testing(key);
    }
}

