import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import type { ActorSubclass, Identity } from "@icp-sdk/core/agent";
import type { IDL } from "@icp-sdk/core/candid";
import type { Principal } from "@icp-sdk/core/principal";

// ICP Ledger canister ID on mainnet
export const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
export const IC_HOST = "https://ic0.app";

/**
 * Admin wallet Principal — the destination for all subscription payments.
 */
export const ADMIN_WALLET_PRINCIPAL = "aaaaa-aa";

// ICRC-1 Transfer error variants
export type TransferError =
  | { BadFee: { expected_fee: bigint } }
  | { BadBurn: { min_burn_amount: bigint } }
  | { InsufficientFunds: { balance: bigint } }
  | { TooOld: null }
  | { CreatedInFuture: { ledger_time: bigint } }
  | { Duplicate: { duplicate_of: bigint } }
  | { TemporarilyUnavailable: null }
  | { GenericError: { error_code: bigint; message: string } };

export type TransferResult = { Ok: bigint } | { Err: TransferError };

export interface IcrcAccount {
  owner: Principal;
  subaccount: [] | [Uint8Array];
}

export interface TransferArg {
  to: IcrcAccount;
  fee: [] | [bigint];
  memo: [] | [Uint8Array];
  from_subaccount: [] | [Uint8Array];
  created_at_time: [] | [bigint];
  amount: bigint;
}

export interface LedgerActor {
  icrc1_balance_of: (account: {
    owner: Principal;
    subaccount: [];
  }) => Promise<bigint>;
  icrc1_transfer: (args: TransferArg) => Promise<TransferResult>;
}

// Build the ICRC-1 IDL interface factory.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const icrc1IdlFactory = (({ IDL: idl }: { IDL: any }) => {
  const Account = idl.Record({
    owner: idl.Principal,
    subaccount: idl.Opt(idl.Vec(idl.Nat8)),
  });

  const TransferArgType = idl.Record({
    to: Account,
    fee: idl.Opt(idl.Nat),
    memo: idl.Opt(idl.Vec(idl.Nat8)),
    from_subaccount: idl.Opt(idl.Vec(idl.Nat8)),
    created_at_time: idl.Opt(idl.Nat64),
    amount: idl.Nat,
  });

  const TransferErrorType = idl.Variant({
    BadFee: idl.Record({ expected_fee: idl.Nat }),
    BadBurn: idl.Record({ min_burn_amount: idl.Nat }),
    InsufficientFunds: idl.Record({ balance: idl.Nat }),
    TooOld: idl.Null,
    CreatedInFuture: idl.Record({ ledger_time: idl.Nat64 }),
    Duplicate: idl.Record({ duplicate_of: idl.Nat }),
    TemporarilyUnavailable: idl.Null,
    GenericError: idl.Record({ error_code: idl.Nat, message: idl.Text }),
  });

  const TransferResultType = idl.Variant({
    Ok: idl.Nat,
    Err: TransferErrorType,
  });

  return idl.Service({
    icrc1_balance_of: idl.Func([Account], [idl.Nat], ["query"]),
    icrc1_transfer: idl.Func([TransferArgType], [TransferResultType], []),
  });
}) as unknown as IDL.InterfaceFactory;

/**
 * Creates an ICP Ledger actor using the provided identity.
 */
export async function createLedgerActor(
  identity: Identity,
): Promise<ActorSubclass<LedgerActor>> {
  const agent = await HttpAgent.create({
    identity,
    host: IC_HOST,
  });

  const actor = Actor.createActor<LedgerActor>(icrc1IdlFactory, {
    agent,
    canisterId: ICP_LEDGER_CANISTER_ID,
  });

  return actor;
}

/**
 * Formats a TransferError into a human-readable string.
 */
export function formatTransferError(error: TransferError): string {
  if ("BadFee" in error) {
    return `Invalid fee. Expected fee: ${error.BadFee.expected_fee} e8s`;
  }
  if ("BadBurn" in error) {
    return `Amount too small to burn. Minimum: ${error.BadBurn.min_burn_amount} e8s`;
  }
  if ("InsufficientFunds" in error) {
    return `Insufficient funds. Balance: ${error.InsufficientFunds.balance} e8s`;
  }
  if ("TooOld" in error) {
    return "Transaction is too old";
  }
  if ("CreatedInFuture" in error) {
    return "Transaction created in the future";
  }
  if ("Duplicate" in error) {
    return `Duplicate transaction (block: ${error.Duplicate.duplicate_of})`;
  }
  if ("TemporarilyUnavailable" in error) {
    return "Ledger temporarily unavailable. Please try again.";
  }
  if ("GenericError" in error) {
    return `Error: ${error.GenericError.message} (code: ${error.GenericError.error_code})`;
  }
  return "Unknown transfer error";
}
