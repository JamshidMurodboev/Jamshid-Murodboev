import { PrismaClient, Role, BatchStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Default admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@crm.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@crm.local",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Default scholarships
  const scholarships = [
    { name: "Türkiye Burslari", shortCode: "TB" },
    { name: "Stipendium Hungaricum", shortCode: "SH" },
    { name: "Diyanet Burslari", shortCode: "DB" },
  ];
  for (const s of scholarships) {
    await prisma.scholarship.upsert({
      where: { shortCode: s.shortCode },
      update: {},
      create: s,
    });
  }

  // Default progress stages
  const stages = [
    "Enrolled",
    "Docs In Progress",
    "Submitted",
    "Interview",
    "Result",
  ];
  for (let i = 0; i < stages.length; i++) {
    await prisma.progressStage.upsert({
      where: { name: stages[i] },
      update: { order: i },
      create: { name: stages[i], order: i },
    });
  }

  // Default discount types
  const discounts = [
    { name: "IELTS 7.5+", description: "High IELTS score discount", discountValue: 10, isPercentage: true },
    { name: "SAT High Score", description: "High SAT score discount", discountValue: 10, isPercentage: true },
    { name: "Olympiad Winner", description: "Academic olympiad winner", discountValue: 15, isPercentage: true },
    { name: "Referral", description: "Referred by existing student", discountValue: 5, isPercentage: true },
    { name: "Lost a Parent", description: "Hardship discount", discountValue: 20, isPercentage: true },
  ];
  for (const d of discounts) {
    await prisma.discountType.upsert({
      where: { id: d.name } as never,
      update: {},
      create: d,
    });
  }

  // Default app settings
  await prisma.appSetting.upsert({
    where: { key: "telegram_alert_days_before" },
    update: {},
    create: { key: "telegram_alert_days_before", value: "3" },
  });

  console.log("✓ Seed complete. Admin login: admin@crm.local / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
