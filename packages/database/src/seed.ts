import "dotenv/config";
import { prisma } from ".";

const GAME_NAMES = [
  "Phoenix Fury", "Velocity Vault", "Alpha Clash",
];

async function main() {
  console.log("Starting seed...");

  await prisma.bet.deleteMany();
  await prisma.agentGame.deleteMany();
  await prisma.game.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  const agentsData = [
    { id: "deepseek", name: "DeepSeek", color: "#60a5fa", accent: "#006ff6" },
    { id: "claude", name: "Claude", color: "#f97316", accent: "#d37100" },
    { id: "openai", name: "OpenAI", color: "#34d399", accent: "#007d2c" },
    { id: "gemini", name: "Gemini", color: "#a78bfa", accent: "#5934ff" },
    { id: "grok", name: "Grok", color: "#f43f5e", accent: "#bf0016" },
  ];

  const agents = [];
  for (const data of agentsData) {
    const agent = await prisma.agent.create({ data });
    agents.push(agent);
  }
  console.log(`${agents.length} agents created.`);

  for (const name of GAME_NAMES) {
    const game = await prisma.game.create({
      data: {
        name,
        agents: { create: agents.map((a) => ({ agentId: a.id })) },
      },
    });
    console.log(`Game created: ${game.name} (${game.id})`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
