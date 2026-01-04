import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.note.createMany({
    data: [
      { title: "Sample Note 1", content: "content 1" },
      { title: "Sample Note 2", content: "content 2" },
      { title: "Sample Note 3", content: "content 3" },
    ],
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
