import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export type ConvertableString =
  | "Immediate"
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Yearly"
  | "TEST";

export interface ThreadTrigger {
  now?: {};
  cron?: { scheduleStr: string };
}

export interface PaymentStatus {
  active?: {};
  cancelled?: {};
  complete?: {};
}

export interface PaymentType {
  threadAuthority: PublicKey;
  tokenAuthority: PublicKey;
  threadKey: PublicKey;
  threadId: number;
  payer: PublicKey;
  receiver: PublicKey;
  mint: PublicKey;
  status: PaymentStatus;
  amount: BN;
  schedule: ThreadTrigger;
}

export interface SeriaizeablePaymentType {
  threadAuthority: string;
  tokenAuthority: string;
  threadKey: string;
  threadId: number;
  payer: string;
  receiver: string;
  mint: string;
  status: PaymentStatus;
  amount: number;
  schedule: ThreadTrigger;
}

export interface SolutioIxParams {
  taOwner: PublicKey;
  receiver: PublicKey;
  mint: PublicKey;
  program: Program;
}

export interface DelegateTransferAuthorityParams extends SolutioIxParams {
  delegateAmount: number;
}

export interface TransferTokensDirectParams extends SolutioIxParams {
  amount: number;
}

export interface SetupPaymentParmas extends SolutioIxParams {
  transferAmount: number;
  threadTrigger: ThreadTrigger;
}

export interface UpdatePaymentParams extends SolutioIxParams {
  threadId: number;
  newAmount: number | null;
  newSchedule: ThreadTrigger | null;
}

export interface CancelPaymentParams extends SolutioIxParams {
  threadId: number;
}

export interface SolutioRequestParams {
  taOwner: string;
  receiver: string;
  mint: string;
}

export interface DirectTransferRequestParams {
  amount: number;
}

export interface SetupRequestParams extends SolutioRequestParams {
  amount: number;
  threadSchedule: ConvertableString;
  delegateAmount?: number;
}

export interface UpdateRequestParams extends SolutioRequestParams {
  threadId: number;
  newAmount: number | null;
  newSchedule: ConvertableString | null;
}

export interface CancelRequestParams extends SolutioRequestParams {
  threadId: number;
}
