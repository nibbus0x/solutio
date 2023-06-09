import { PublicKey } from "@solana/web3.js";

// Seeds
export const THREAD_SEED = Buffer.from("thread");
export const TOKEN_AUTHORITY_SEED = Buffer.from("token_authority");
export const THREAD_AUTHORITY_SEED = Buffer.from("thread_authority");
export const PAYMENT_SEED = Buffer.from("payment");
export const PROGRAM_AS_SIGNER_SEED = Buffer.from("program_signer");

// Pubkeys
export const SOLUTIO_PROGRAM_ID = new PublicKey(
  "8sbSXaprHK3Mr9ft8QpAQqZHz4PEsaSH9dv5gAGtqcow"
);
export const CLOCKWORK_THREAD_PROGRAM_ID = new PublicKey(
  "CLoCKyJ6DXBJqqu2VWx9RLbgnwwR6BMHHuyasVmfMzBh"
);
export const COMPUTE_BUDGET_PROGRAM_ID = new PublicKey(
  "ComputeBudget111111111111111111111111111111"
);

// Misc
export const NEXT_THREAD_ID_INDEX = 8 + 32;
export const SOLANA_PAY_SERVER_URL = "https://sps.solutioapp.xyz";
export const PAYMENTS_SERVER_URL = "https://payments.solutioapp.xyz";
export const EXAMPLE_SERVER_URL = "https://example.solutioapp.xyz";
