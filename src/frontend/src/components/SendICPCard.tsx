import { ArrowRight, CheckCircle, Loader2, Send, XCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useSendICP } from "../hooks/useSendICP";
import { isValidPrincipal, validateTransferAmount } from "../utils/validation";

interface SendICPCardProps {
  balance: string | undefined;
}

export function SendICPCard({ balance }: SendICPCardProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [recipientError, setRecipientError] = useState("");
  const [amountError, setAmountError] = useState("");

  const {
    mutate: sendICP,
    isPending,
    isSuccess,
    isError,
    error,
    reset,
  } = useSendICP();

  const validateForm = (): boolean => {
    let valid = true;

    if (!isValidPrincipal(recipient)) {
      setRecipientError("Invalid Principal ID format");
      valid = false;
    } else {
      setRecipientError("");
    }

    const amtErr = validateTransferAmount(amount, balance ?? null);
    if (amtErr) {
      setAmountError(amtErr);
      valid = false;
    } else {
      setAmountError("");
    }

    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reset();

    if (!validateForm()) return;

    sendICP(
      { recipientPrincipal: recipient, amountIcp: amount },
      {
        onSuccess: () => {
          setRecipient("");
          setAmount("");
          setRecipientError("");
          setAmountError("");
        },
      },
    );
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
    if (recipientError) setRecipientError("");
    if (isSuccess || isError) reset();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    if (amountError) setAmountError("");
    if (isSuccess || isError) reset();
  };

  return (
    <div
      data-ocid="send.card"
      className="premium-card rounded-3xl p-6 animate-slide-up"
      style={{ animationDelay: "0.08s" }}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl gradient-teal flex items-center justify-center teal-glow">
          <Send className="text-primary-foreground" size={17} />
        </div>
        <div>
          <p className="section-label">Transfer</p>
          <p className="text-sm font-bold font-display text-foreground leading-tight">
            Send ICP
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient Field */}
        <div>
          <label htmlFor="recipient-input" className="section-label block mb-2">
            Recipient Principal ID
          </label>
          <input
            id="recipient-input"
            data-ocid="send.recipient.input"
            type="text"
            value={recipient}
            onChange={handleRecipientChange}
            placeholder="e.g. aaaaa-aa or xxxxx-xxxxx-xxxxx-cai"
            className={`input-dark w-full px-4 py-3 text-sm font-mono ${
              recipientError
                ? "border-destructive/60 focus:border-destructive"
                : ""
            }`}
            disabled={isPending}
            autoComplete="off"
            spellCheck={false}
          />
          {recipientError && (
            <p
              data-ocid="send.recipient.error_state"
              className="mt-1.5 text-xs text-destructive flex items-center gap-1"
            >
              <XCircle size={12} />
              {recipientError}
            </p>
          )}
        </div>

        {/* Amount Field */}
        <div>
          <label htmlFor="amount-input" className="section-label block mb-2">
            Amount (ICP)
          </label>
          <div className="relative">
            <input
              id="amount-input"
              data-ocid="send.amount.input"
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.0000"
              step="0.0001"
              min="0"
              className={`input-dark w-full px-4 py-3 pr-16 text-sm ${
                amountError
                  ? "border-destructive/60 focus:border-destructive"
                  : ""
              }`}
              disabled={isPending}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary pointer-events-none">
              ICP
            </span>
          </div>
          {amountError && (
            <p
              data-ocid="send.amount.error_state"
              className="mt-1.5 text-xs text-destructive flex items-center gap-1"
            >
              <XCircle size={12} />
              {amountError}
            </p>
          )}
          {balance && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Available:{" "}
              <span className="text-primary font-semibold">{balance} ICP</span>
              <span className="text-muted-foreground/60">
                {" "}
                · Fee: 0.0001 ICP
              </span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          data-ocid="send.submit_button"
          disabled={isPending}
          className="btn-teal w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm mt-2"
        >
          {isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Send ICP</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {/* Status Messages */}
      {isSuccess && (
        <div
          data-ocid="send.success_state"
          className="mt-4 p-3.5 rounded-xl bg-success/10 border border-success/25 flex items-start gap-2.5 animate-fade-in"
        >
          <CheckCircle
            size={15}
            className="text-success mt-0.5 flex-shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-success">
              Transfer Successful
            </p>
            <p className="text-xs text-success/70 mt-0.5">
              Your ICP has been sent. Balance will refresh shortly.
            </p>
          </div>
        </div>
      )}

      {isError && error && (
        <div
          data-ocid="send.error_state"
          className="mt-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2.5 animate-fade-in"
        >
          <XCircle
            size={15}
            className="text-destructive mt-0.5 flex-shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-destructive">
              Transfer Failed
            </p>
            <p className="text-xs text-destructive/70 mt-0.5">
              {error.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
