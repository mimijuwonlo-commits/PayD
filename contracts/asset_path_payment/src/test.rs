#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _};
use soroban_sdk::{vec, Env, String};

fn create_contract() -> (Env, Address) {
    let env = Env::default();
    let contract_id = env.register(AssetPathPaymentContract, ());
    env.as_contract(&contract_id, || {
        let admin = Address::generate(&env);
        AssetPathPaymentContract::init(env.clone(), admin);
    });
    (env, contract_id)
}

#[test]
fn test_init() {
    let env = Env::default();
    let contract_id = env.register(AssetPathPaymentContract, ());

    env.as_contract(&contract_id, || {
        let admin = Address::generate(&env);
        AssetPathPaymentContract::init(env.clone(), admin.clone());

        // Verify admin is set
        let stored_admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        assert_eq!(stored_admin, admin);

        // Verify payment count is 0
        let count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::PaymentCount)
            .unwrap();
        assert_eq!(count, 0);
    });
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_double_init() {
    let env = Env::default();
    let contract_id = env.register(AssetPathPaymentContract, ());

    env.as_contract(&contract_id, || {
        let admin = Address::generate(&env);
        AssetPathPaymentContract::init(env.clone(), admin);
        let admin2 = Address::generate(&env);
        AssetPathPaymentContract::init(env.clone(), admin2);
    });
}

#[test]
fn test_get_payment_count() {
    let env = Env::default();
    let contract_id = env.register(AssetPathPaymentContract, ());

    env.as_contract(&contract_id, || {
        let admin = Address::generate(&env);
        AssetPathPaymentContract::init(env.clone(), admin);

        let count = AssetPathPaymentContract::get_payment_count(env.clone());
        assert_eq!(count, 0);
    });
}

#[test]
fn test_bump_ttl() {
    let env = Env::default();
    let contract_id = env.register(AssetPathPaymentContract, ());
    let client = AssetPathPaymentContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.init(&admin);
    env.mock_all_auths();
    client.bump_ttl();
}

#[test]
fn test_initiate_path_payment_rejects_invalid_amounts() {
    let (env, contract_id) = create_contract();
    let from = Address::generate(&env);
    let to = Address::generate(&env);
    let source_asset = Address::generate(&env);
    let dest_asset = Address::generate(&env);

    env.mock_all_auths();
    env.as_contract(&contract_id, || {
        let result = AssetPathPaymentContract::initiate_path_payment(
            env.clone(),
            from.clone(),
            to.clone(),
            source_asset.clone(),
            dest_asset.clone(),
            0,
            10,
            10,
            vec![&env],
        );
        assert_eq!(result, Err(PathPaymentError::InvalidAmount));
    });

    env.as_contract(&contract_id, || {
        let result = AssetPathPaymentContract::initiate_path_payment(
            env.clone(),
            from,
            to,
            source_asset,
            dest_asset,
            10,
            9,
            5,
            vec![&env],
        );
        assert_eq!(result, Err(PathPaymentError::SlippageExceeded));
    });
}

#[test]
fn test_complete_path_payment_rejects_unknown_payment() {
    let env = Env::default();
    let contract_id = env.register(AssetPathPaymentContract, ());
    let admin = Address::generate(&env);

    env.as_contract(&contract_id, || {
        AssetPathPaymentContract::init(env.clone(), admin);
    });

    env.mock_all_auths();
    env.as_contract(&contract_id, || {
        let result = AssetPathPaymentContract::complete_path_payment(env.clone(), 999, 100, 95);
        assert_eq!(result, Err(PathPaymentError::PaymentNotFound));
    });
}

#[test]
fn test_fail_path_payment_rejects_unknown_payment() {
    let env = Env::default();
    let contract_id = env.register(AssetPathPaymentContract, ());
    let admin = Address::generate(&env);

    env.as_contract(&contract_id, || {
        AssetPathPaymentContract::init(env.clone(), admin);
    });

    env.mock_all_auths();
    env.as_contract(&contract_id, || {
        let result = AssetPathPaymentContract::fail_path_payment(
            env.clone(),
            999,
            PathPaymentError::PathNotFound as u32,
            String::from_str(&env, "Path not found"),
            false,
        );
        assert_eq!(result, Err(PathPaymentError::PaymentNotFound));
    });
}

#[test]
fn test_withdraw_rejects_non_positive_amounts() {
    let env = Env::default();
    let contract_id = env.register(AssetPathPaymentContract, ());
    let admin = Address::generate(&env);
    let recipient = Address::generate(&env);
    let asset = Address::generate(&env);

    env.as_contract(&contract_id, || {
        AssetPathPaymentContract::init(env.clone(), admin);
    });

    env.mock_all_auths();
    env.as_contract(&contract_id, || {
        let result = AssetPathPaymentContract::withdraw(env.clone(), asset, 0, recipient);
        assert_eq!(result, Err(PathPaymentError::InvalidAmount));
    });
}
