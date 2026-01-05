import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.note.createMany({
    data: [
      { title: "Sample Note 1", content: "content 1", anonId: "seed-user-1" },
      { title: "Sample Note 2", content: "content 2", anonId: "seed-user-2" },
      { title: "Sample Note 3", content: "content 3", anonId: "seed-user-3" },
    ] as any,
  });
  console.log("Seeded data");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
