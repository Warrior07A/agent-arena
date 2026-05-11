const JUPITER_API = "https://api.jup.ag/swap/v1";
const JUPITER_API_KEY = process.env.JUPITER_API_KEY ?? "";

// Devnet USDC (Circle's devnet USDC)
export const USDC_MINT =
  process.env.NEXT_PUBLIC_USDC_MINT ??
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const SOL_MINT = "So11111111111111111111111111111111111111112";

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot: number;
  timeTaken: number;
}

export interface SwapTransaction {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
  computeUnitLimit: number;
  dynamicComputeUnitLimit: boolean;
  simulationError: string | null;
}

export async function getSwapQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
}): Promise<SwapQuote> {
  const { inputMint, outputMint, amount, slippageBps = 50 } = params;

  const url = new URL(`${JUPITER_API}/quote`);
  url.searchParams.set("inputMint", inputMint);
  url.searchParams.set("outputMint", outputMint);
  url.searchParams.set("amount", amount);
  url.searchParams.set("slippageBps", String(slippageBps));
  url.searchParams.set("onlyDirectRoutes", "false");
  url.searchParams.set("maxAccounts", "64");

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (JUPITER_API_KEY) {
    headers["x-api-key"] = JUPITER_API_KEY;
  }

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Jupiter quote failed: ${res.status} ${error}`);
  }

  return res.json();
}

export async function getSwapTransaction(params: {
  quoteResponse: SwapQuote;
  userPublicKey: string;
  wrapUnwrapSOL?: boolean;
  feeAccount?: string;
  prioritizationFeeLamports?: number | "auto";
  destinationTokenAccount?: string;
}): Promise<SwapTransaction> {
  const {
    quoteResponse,
    userPublicKey,
    wrapUnwrapSOL = true,
    feeAccount,
    prioritizationFeeLamports = "auto",
    destinationTokenAccount,
  } = params;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (JUPITER_API_KEY) {
    headers["x-api-key"] = JUPITER_API_KEY;
  }

  const body: Record<string, unknown> = {
    quoteResponse,
    userPublicKey,
    wrapUnwrapSOL,
    prioritizationFeeLamports,
  };
  if (feeAccount) {
    body.feeAccount = feeAccount;
  }
  if (destinationTokenAccount) {
    body.destinationTokenAccount = destinationTokenAccount;
  }

  const res = await fetch(`${JUPITER_API}/swap`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Jupiter swap tx failed: ${res.status} ${error}`);
  }

  return res.json();
}
