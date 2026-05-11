import { Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

const DEVNET_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

async function main() {
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const secretKey = JSON.stringify(Array.from(keypair.secretKey));

  const usdcAta = await getAssociatedTokenAddress(
    new PublicKey(DEVNET_USDC),
    keypair.publicKey
  );

  console.log("\n- Shared Escrow Keypair\n");
  console.log(`  Public Key      : ${publicKey}`);
  console.log(`  USDC ATA        : ${usdcAta.toBase58()}`);
  console.log(`  Private Key     : ${secretKey}`);

  console.log("\n- Add to apps/web/.env\n");
  console.log(`  SHARED_ESCROW_PRIVATE_KEY='${secretKey}'`);
  console.log(`  # USDC ATA (for reference): ${usdcAta.toBase58()}\n`);
}

main();
