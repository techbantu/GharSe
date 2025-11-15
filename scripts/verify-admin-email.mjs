/**
 * QUICK FIX: Verify Admin Email
 * 
 * Purpose: Manually verify admin email to allow login
 * Usage: node scripts/verify-admin-email.mjs <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAdminEmail(email) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      console.error(`❌ Admin with email ${email} not found`);
      process.exit(1);
    }

    if (admin.emailVerified) {
      console.log(`✅ Email ${email} is already verified`);
      process.exit(0);
    }

    // Verify the email
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    console.log(`✅ Successfully verified email for ${email}`);
    console.log(`📧 Admin: ${admin.name}`);
    console.log(`🔑 Role: ${admin.role}`);
    console.log(`\n🎉 You can now login at: http://localhost:3000/admin/login`);
  } catch (error) {
    console.error('❌ Error verifying email:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line or use default
const email = process.argv[2] || 'admin@bantuskitchen.com';

console.log(`🔐 Verifying admin email: ${email}\n`);
verifyAdminEmail(email);

