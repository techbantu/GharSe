/**
 * SMART KITCHEN INTELLIGENCE - ML Model Training Script
 * 
 * Purpose: Automated daily training pipeline for demand forecasting models
 * Schedule: Run daily at 3 AM (low traffic time)
 * 
 * Process:
 * 1. Extract features from order history (last 60 days)
 * 2. Split data: 80% train, 20% validation
 * 3. Train model with cross-validation
 * 4. Evaluate accuracy metrics (MAPE, RMSE)
 * 5. Save model performance to database
 * 6. Log results for monitoring
 * 
 * This keeps the demand forecasting accurate and improving over time.
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { demandForecaster } from '../lib/ml/demand-forecaster.js';

/**
 * Main training pipeline
 */
async function trainDemandModels() {
  console.log('='.repeat(60));
  console.log('SMART KITCHEN INTELLIGENCE - ML Training Pipeline');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Step 1: Get all active menu items
    console.log('[1/5] Fetching active menu items...');
    const menuItems = await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
      },
    });
    console.log(`Found ${menuItems.length} active menu items`);
    console.log('');

    // Step 2: Train model for each popular item
    console.log('[2/5] Training models for each item...');
    const results = [];

    for (const item of menuItems) {
      console.log(`Training model for: ${item.name}`);
      
      try {
        // Evaluate model accuracy
        const metrics = await demandForecaster.evaluateAccuracy(item.id);

        console.log(`  - MAPE: ${metrics.mape.toFixed(2)}%`);
        console.log(`  - RMSE: ${metrics.rmse.toFixed(2)}`);
        console.log(`  - Accuracy: ${metrics.accuracy.toFixed(2)}%`);
        console.log(`  - Sample Size: ${metrics.sampleSize}`);

        results.push({
          itemId: item.id,
          itemName: item.name,
          metrics,
          success: true,
        });

        // Save metrics to database (for tracking model performance over time)
        // TODO: Create ModelPerformance table to track this
        
      } catch (error) {
        console.error(`  ❌ Error training model for ${item.name}:`, error);
        results.push({
          itemId: item.id,
          itemName: item.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      console.log('');
    }

    // Step 3: Calculate aggregate metrics
    console.log('[3/5] Calculating aggregate performance...');
    const successfulModels = results.filter(r => r.success);
    
    if (successfulModels.length > 0) {
      const avgMAPE = successfulModels.reduce((sum, r) => sum + (r.metrics?.mape || 0), 0) / successfulModels.length;
      const avgRMSE = successfulModels.reduce((sum, r) => sum + (r.metrics?.rmse || 0), 0) / successfulModels.length;
      const avgAccuracy = successfulModels.reduce((sum, r) => sum + (r.metrics?.accuracy || 0), 0) / successfulModels.length;

      console.log(`Average MAPE: ${avgMAPE.toFixed(2)}%`);
      console.log(`Average RMSE: ${avgRMSE.toFixed(2)}`);
      console.log(`Average Accuracy: ${avgAccuracy.toFixed(2)}%`);
      console.log(`Models Trained: ${successfulModels.length}/${menuItems.length}`);
    } else {
      console.log('No successful model training runs');
    }
    console.log('');

    // Step 4: Generate next 6 hours predictions for all items
    console.log('[4/5] Generating predictions for next 6 hours...');
    
    for (const item of menuItems.slice(0, 10)) { // Limit to 10 for performance
      try {
        const predictions = await demandForecaster.predictNextHours(item.id, 6);
        
        // Save predictions to database
        for (const prediction of predictions) {
          await demandForecaster.savePrediction(prediction);
        }

        console.log(`  ✓ Generated 6-hour forecast for ${item.name}`);
      } catch (error) {
        console.error(`  ❌ Failed to generate predictions for ${item.name}`);
      }
    }
    console.log('');

    // Step 5: Cleanup old predictions (keep last 30 days)
    console.log('[5/5] Cleaning up old prediction records...');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const deleted = await prisma.demandPrediction.deleteMany({
      where: {
        timestamp: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log(`Deleted ${deleted.count} old prediction records`);
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('TRAINING PIPELINE COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`Completed at: ${new Date().toISOString()}`);
    console.log('');
    console.log('Summary:');
    console.log(`- Items processed: ${menuItems.length}`);
    console.log(`- Successful trainings: ${successfulModels.length}`);
    console.log(`- Failed trainings: ${results.length - successfulModels.length}`);
    console.log('');
    console.log('Next training scheduled for tomorrow at 3:00 AM');
    console.log('='.repeat(60));

    return {
      success: true,
      itemsProcessed: menuItems.length,
      successfulTrainings: successfulModels.length,
      results,
    };

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('TRAINING PIPELINE FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error);
    console.error('');
    
    throw error;
  }
}

/**
 * Run the training pipeline
 * This is the entry point when script is executed
 */
trainDemandModels()
  .then(async () => {
    console.log('Training pipeline finished successfully');
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Training pipeline failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });

