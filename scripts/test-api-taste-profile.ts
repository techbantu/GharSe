/**
 * TEST SCRIPT: Test the taste profile API endpoint
 */

import { analyzeTasteProfile } from '../lib/taste-analyzer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAPI() {
  try {
    console.log('🧪 Testing Taste Profile API\n');

    // Get RJ's customer ID
    const customer = await prisma.customer.findUnique({
      where: { email: 'techbantu@gmail.com' },
    });

    if (!customer) {
      console.log('❌ Customer not found!');
      return;
    }

    console.log(`Testing for: ${customer.name} (${customer.id})\n`);

    // Call the actual function used by the API
    console.log('Calling analyzeTasteProfile...\n');
    const result = await analyzeTasteProfile(customer.id);

    console.log('📊 RESULT:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n🎯 KEY METRICS:');
    console.log(`  Dishes Discovered: ${result.explorationStats.totalDishes}`);
    console.log(`  Exploration %: ${result.explorationStats.explorationPercentage}%`);
    console.log(`  Categories: ${result.explorationStats.categoriesExplored.join(', ')}`);
    console.log(`  Explorer Rank: ${result.explorationStats.explorerRank}`);
    console.log(`  Flavor Archetype: ${result.flavorArchetype.name}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();

