use crate::{
    error::SolutioError,
    state::{AcceptedTriggers, Payment, ThreadAuthority, TokenAuthority, PROGRAM_AS_SIGNER_SEED},
    util::verify_trigger,
};
use anchor_lang::{prelude::*, InstructionData};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use clockwork_sdk::{
    cpi::{thread_update, ThreadUpdate},
    state::{SerializableAccount, SerializableInstruction, ThreadSettings, Thread},
    ThreadProgram,
};
use clockwork_thread_program::{state::SEED_THREAD, ID as THREAD_PROGRAM_ID};

#[derive(Accounts)]
#[instruction(thread_id: u8)]
pub struct UpadtePayment<'info> {
    #[account(
        mut,
        seeds = [
            ThreadAuthority::SEED,
            token_account_owner.key().as_ref(),
        ],
        bump
    )]
    pub thread_authority: Box<Account<'info, ThreadAuthority>>,
    #[account(
        mut,
        seeds = [
            Payment::SEED,
            token_account_owner.key().as_ref(),
            thread.key().as_ref()
        ],
        bump
    )]
    pub payment: Box<Account<'info, Payment>>,
    pub token_account_owner: Signer<'info>,
    /// CHECK: Seeds checked in constraint
    #[account(
        mut,
        seeds = [
            SEED_THREAD,
            thread_authority.key().as_ref(),
            &[thread_id]
        ],
        bump,
        seeds::program = THREAD_PROGRAM_ID
    )]
    pub thread: Box<Account<'info, Thread>>,
    pub thread_program: Program<'info, ThreadProgram>,
    pub system_program: Program<'info, System>,
    #[account(
        seeds = [
            TokenAuthority::SEED,
            token_account_owner.as_ref().key().as_ref(),
            token_account.as_ref().unwrap().key().as_ref(),
            receiver_token_account.as_ref().unwrap().key().as_ref(),
        ],
        bump
    )]
    pub token_account_authority: Option<Box<Account<'info, TokenAuthority>>>,
    pub mint: Option<Box<Account<'info, Mint>>>,
    // Need not be assosiated ta
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = token_account_owner,
    )]
    pub token_account: Option<Box<Account<'info, TokenAccount>>>,
    // Need not be assosiated ta
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = receiver,
    )]
    pub receiver_token_account: Option<Box<Account<'info, TokenAccount>>>,
    pub receiver: Option<SystemAccount<'info>>,
    #[account(
        seeds = [PROGRAM_AS_SIGNER_SEED],
        bump
    )]
    pub program_as_signer: Option<SystemAccount<'info>>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = program_as_signer,
    )]
    pub program_token_account: Option<Box<Account<'info, TokenAccount>>>,
    pub token_program: Option<Program<'info, Token>>,
    pub associated_token_program: Option<Program<'info, AssociatedToken>>,
}

pub fn handler(
    ctx: Context<UpadtePayment>,
    _thread_id: u8,
    new_trigger: Option<AcceptedTriggers>,
    new_transfer_amount: Option<u64>,
) -> Result<()> {
    let thread_auth_bump = *ctx
        .bumps
        .get("thread_authority")
        .ok_or(SolutioError::MissingBump)?;

    let client_pubkey = ctx.accounts.token_account_owner.key();
    let thread_auth_seeds = &[
        ThreadAuthority::SEED,
        client_pubkey.as_ref(),
        &[thread_auth_bump],
    ];
    let signer = &[&thread_auth_seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.thread_program.to_account_info(),
        ThreadUpdate {
            authority: ctx.accounts.thread_authority.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            thread: ctx.accounts.thread.to_account_info(),
        },
        signer,
    );

    let trigger = match new_trigger {
        Some(t) => {
            ctx.accounts.payment.schedule = t.clone();
            Some(verify_trigger(t.clone())?)
        }
        None => None,
    };

    let new_ixs = match new_transfer_amount {
        Some(amnt) => {
            ctx.accounts.payment.amount = amnt;
            let ix_data = crate::instruction::TransferTokensViaAuthority { amount: amnt };

            let acnts = crate::accounts::TransferTokensViaAuthority {
                token_account_authority: ctx
                    .accounts
                    .token_account_authority
                    .clone()
                    .ok_or(SolutioError::MissingOptionalAccount)?.key(),
                mint: ctx
                    .accounts
                    .mint
                    .clone()
                    .ok_or(SolutioError::MissingOptionalAccount)?.key(),
                token_account: ctx
                    .accounts
                    .token_account
                    .clone()
                    .ok_or(SolutioError::MissingOptionalAccount)?.key(),
                receiver_token_account: ctx
                    .accounts
                    .receiver_token_account
                    .clone()
                    .ok_or(SolutioError::MissingOptionalAccount)?.key(),
                token_account_owner: ctx.accounts.token_account_owner.key(),
                receiver: ctx
                    .accounts
                    .receiver
                    .clone()
                    .ok_or(SolutioError::MissingOptionalAccount)?.key(),
                signing_thread: ctx.accounts.thread.key(),
                program_as_signer: ctx
                    .accounts
                    .program_as_signer
                    .clone()
                    .ok_or(SolutioError::MissingOptionalAccount)?.key(),
                program_token_account: ctx
                    .accounts
                    .program_token_account
                    .clone()
                    .ok_or(SolutioError::MissingOptionalAccount)?.key(),
                system_program: ctx.accounts.system_program.key(),
                token_program: ctx
                    .accounts
                    .token_program
                    .clone()
                    .ok_or(SolutioError::MissingOptionalAccount)?.key(),
                associated_token_program: ctx
                    .accounts
                    .associated_token_program
                    .clone()
                    .ok_or(SolutioError::MissingOptionalAccount)?.key(),
            }
            .to_account_metas(None)
            .into_iter()
            .map(|meta| SerializableAccount {
                pubkey: meta.pubkey,
                is_signer: meta.pubkey.eq(&ctx.accounts.thread.key()),
                is_writable: meta.is_writable,
            })
            .collect();

            let ix = SerializableInstruction {
                program_id: *ctx.program_id,
                data: ix_data.data(),
                accounts: acnts,
            };

            Some(vec![ix])
        }
        None => None,
    };

    thread_update(
        cpi_ctx,
        ThreadSettings {
            fee: None,
            instructions: new_ixs,
            name: None,
            rate_limit: None,
            trigger,
        },
    )?;

    Ok(())
}
