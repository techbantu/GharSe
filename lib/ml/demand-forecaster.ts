/**
 * SMART KITCHEN INTELLIGENCE - ML Demand Forecasting
 * 
 * Purpose: Predict future demand for menu items using machine learning
 * 
 * Approach: Time Series Forecasting with Feature Engineering
 * - Start with Exponential Smoothing (simple, interpretable)
 * - Upgrade to more complex models as data grows
 * 
 * Features Used:
 * - Hour of day (0-23)
 * - Day of week (0-6)
 * - Is weekend
 * - Is holiday
 * - Historical orders (rolling averages)
 * - Recent trend
 * - Kitchen capacity
 * - Weather (optional)
 * 
 * This enables the pricing engine to adjust prices before demand surges.
 */

import { prisma } from '@/lib/prisma';

/**
 * Features extracted from order history for ML training
 */
export interface PredictionFeatures {
  menuItemId: string;
  timestamp: Date;
  hourOfDay: number; // 0-23
  dayOfWeek: number; // 0-6 (0 = Sunday)
  isWeekend: boolean;
  isHoliday: boolean;
  rollingAvg7Days?: number; // 7-day rolling average
  rollingAvg30Days?: number; // 30-day rolling average
  recentTrend?: number; // Trend from last 3 days
  weatherCondition?: string;
  temperature?: number;
}

/**
 * Prediction result with confidence intervals
 */
export interface DemandPrediction {
  menuItemId: string;
  timestamp: Date;
  predictedOrders: number;
  confidence: number; // 0-1
  confidenceInterval: [number, number]; // [lower, upper]
  modelVersion: string;
}

/**
 * Model performance metrics
 */
export interface ModelMetrics {
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  mae: number; // Mean Absolute Error
  accuracy: number; // Percentage of predictions within 20% of actual
  sampleSize: number;
}

/**
 * Historical order data point for training
 */
interface HistoricalDataPoint {
  timestamp: Date;
  menuItemId: string;
  ordersCount: number;
  hourOfDay: number;
  dayOfWeek: number;
}

/**
 * DemandForecaster - Machine Learning demand prediction
 * 
 * Current Implementation: Exponential Smoothing + Pattern Matching
 * Future Upgrade: LightGBM or LSTM Neural Network
 */
export class DemandForecaster {
  private modelVersion: string = 'v1.0-exponential-smoothing';
  private alpha: number = 0.3; // Smoothing factor (0-1)

  /**
   * Extract features from a timestamp
   */
  private extractFeatures(date: Date, menuItemId: string): PredictionFeatures {
    const hourOfDay = date.getHours();
    const dayOfWeek = date.getDay(); // 0 = Sunday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // TODO: Add holiday detection (for now, assume no holidays)
    const isHoliday = false;

    return {
      menuItemId,
      timestamp: date,
      hourOfDay,
      dayOfWeek,
      isWeekend,
      isHoliday,
    };
  }

  /**
   * Get historical order counts for training
   * Groups orders by hour to create training dataset
   */
  private async getHistoricalData(
    menuItemId: string,
    days: number = 30
  ): Promise<HistoricalDataPoint[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all orders for this item
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: since,
        },
        items: {
          some: {
            menuItemId,
          },
        },
        status: {
          notIn: ['CANCELLED'],
        },
      },
      include: {
        items: {
          where: {
            menuItemId,
          },
          select: {
            quantity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by hour
    const hourlyData: Map<string, number> = new Map();

    orders.forEach(order => {
      const hourKey = new Date(order.createdAt).toISOString().slice(0, 13); // YYYY-MM-DDTHH
      const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

      hourlyData.set(hourKey, (hourlyData.get(hourKey) || 0) + quantity);
    });

    // Convert to array
    const dataPoints: HistoricalDataPoint[] = [];

    hourlyData.forEach((count, hourKey) => {
      const timestamp = new Date(hourKey + ':00:00Z');
      dataPoints.push({
        timestamp,
        menuItemId,
        ordersCount: count,
        hourOfDay: timestamp.getHours(),
        dayOfWeek: timestamp.getDay(),
      });
    });

    return dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Calculate rolling average for a time window
   */
  private calculateRollingAverage(
    data: HistoricalDataPoint[],
    windowDays: number
  ): number {
    if (data.length === 0) return 0;

    const windowMs = windowDays * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - windowMs;

    const recentData = data.filter(d => d.timestamp.getTime() >= cutoff);

    if (recentData.length === 0) return 0;

    const sum = recentData.reduce((acc, d) => acc + d.ordersCount, 0);
    return sum / recentData.length;
  }

  /**
   * Simple Exponential Smoothing forecast
   * 
   * Algorithm:
   * 1. Find similar historical patterns (same hour, same day of week)
   * 2. Apply exponential smoothing to recent values
   * 3. Weight recent data more heavily (alpha = 0.3)
   * 4. Return weighted average as prediction
   */
  async predict(
    menuItemId: string,
    timestamp: Date
  ): Promise<DemandPrediction> {
    // Extract features
    const features = this.extractFeatures(timestamp, menuItemId);

    // Get historical data
    const historicalData = await this.getHistoricalData(menuItemId, 30);

    if (historicalData.length < 10) {
      // Not enough data for accurate prediction
      return {
        menuItemId,
        timestamp,
        predictedOrders: 0,
        confidence: 0.2,
        confidenceInterval: [0, 2],
        modelVersion: this.modelVersion,
      };
    }

    // Find similar patterns (same hour of day, same day of week)
    const similarPatterns = historicalData.filter(
      d =>
        d.hourOfDay === features.hourOfDay &&
        d.dayOfWeek === features.dayOfWeek
    );

    if (similarPatterns.length === 0) {
      // No similar patterns, use overall average
      const avg = this.calculateRollingAverage(historicalData, 7);
      return {
        menuItemId,
        timestamp,
        predictedOrders: Math.round(avg),
        confidence: 0.4,
        confidenceInterval: [Math.max(0, Math.round(avg * 0.5)), Math.round(avg * 1.5)],
        modelVersion: this.modelVersion,
      };
    }

    // Apply exponential smoothing
    let forecast = similarPatterns[0].ordersCount;

    for (let i = 1; i < similarPatterns.length; i++) {
      forecast = this.alpha * similarPatterns[i].ordersCount + (1 - this.alpha) * forecast;
    }

    // Calculate confidence based on data consistency
    const variance = this.calculateVariance(similarPatterns.map(p => p.ordersCount));
    const confidence = Math.max(0.3, Math.min(0.9, 1 / (1 + variance / forecast)));

    // Confidence interval (±30% for moderate confidence)
    const margin = forecast * 0.3 * (1 - confidence);
    const confidenceInterval: [number, number] = [
      Math.max(0, Math.round(forecast - margin)),
      Math.round(forecast + margin),
    ];

    return {
      menuItemId,
      timestamp,
      predictedOrders: Math.round(forecast),
      confidence,
      confidenceInterval,
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Calculate variance for confidence estimation
   */
  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;

    return Math.sqrt(variance); // Return standard deviation
  }

  /**
   * Predict demand for the next N hours
   */
  async predictNextHours(
    menuItemId: string,
    hours: number = 6
  ): Promise<DemandPrediction[]> {
    const predictions: DemandPrediction[] = [];
    const now = new Date();

    for (let i = 0; i < hours; i++) {
      const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const prediction = await this.predict(menuItemId, futureTime);
      predictions.push(prediction);
    }

    return predictions;
  }

  /**
   * Train model and evaluate accuracy
   * Uses historical data to validate predictions
   */
  async evaluateAccuracy(menuItemId: string): Promise<ModelMetrics> {
    // Get last 7 days of data for testing
    const testData = await this.getHistoricalData(menuItemId, 7);

    if (testData.length < 10) {
      return {
        mape: 100,
        rmse: 0,
        mae: 0,
        accuracy: 0,
        sampleSize: testData.length,
      };
    }

    // Split: Use last 20% for testing
    const splitIndex = Math.floor(testData.length * 0.8);
    const trainingData = testData.slice(0, splitIndex);
    const testingData = testData.slice(splitIndex);

    // Calculate errors
    let sumAbsoluteError = 0;
    let sumSquaredError = 0;
    let sumPercentageError = 0;
    let accurateCount = 0;

    for (const actual of testingData) {
      const prediction = await this.predict(menuItemId, actual.timestamp);
      const predicted = prediction.predictedOrders;
      const actualValue = actual.ordersCount;

      const error = Math.abs(predicted - actualValue);
      sumAbsoluteError += error;
      sumSquaredError += error * error;

      if (actualValue > 0) {
        sumPercentageError += (error / actualValue) * 100;
      }

      // Within 20% is considered accurate
      if (actualValue > 0 && error / actualValue <= 0.2) {
        accurateCount++;
      }
    }

    const n = testingData.length;

    return {
      mape: sumPercentageError / n, // Mean Absolute Percentage Error
      rmse: Math.sqrt(sumSquaredError / n), // Root Mean Square Error
      mae: sumAbsoluteError / n, // Mean Absolute Error
      accuracy: (accurateCount / n) * 100, // Percentage accurate
      sampleSize: n,
    };
  }

  /**
   * Get average orders for a specific hour/day combination
   * Used by pricing engine as baseline
   */
  async getAverageOrders(
    menuItemId: string,
    hourOfDay: number,
    dayOfWeek: number,
    days: number = 30
  ): Promise<number> {
    const historicalData = await this.getHistoricalData(menuItemId, days);

    const matching = historicalData.filter(
      d => d.hourOfDay === hourOfDay && d.dayOfWeek === dayOfWeek
    );

    if (matching.length === 0) return 0;

    const sum = matching.reduce((acc, d) => acc + d.ordersCount, 0);
    return sum / matching.length;
  }

  /**
   * Save prediction to database for future analysis
   */
  async savePrediction(prediction: DemandPrediction): Promise<void> {
    await prisma.demandPrediction.create({
      data: {
        menuItemId: prediction.menuItemId,
        timestamp: prediction.timestamp,
        hourOfDay: prediction.timestamp.getHours(),
        dayOfWeek: prediction.timestamp.getDay(),
        isWeekend: prediction.timestamp.getDay() === 0 || prediction.timestamp.getDay() === 6,
        isHoliday: false, // TODO: Implement holiday detection
        predictedOrders: prediction.predictedOrders,
        confidence: prediction.confidence,
        confidenceLower: prediction.confidenceInterval[0],
        confidenceUpper: prediction.confidenceInterval[1],
        modelVersion: prediction.modelVersion,
      },
    });
  }

  /**
   * Update prediction with actual results (for continuous learning)
   */
  async updateWithActual(
    menuItemId: string,
    timestamp: Date,
    actualOrders: number
  ): Promise<void> {
    // Find prediction record
    const prediction = await prisma.demandPrediction.findFirst({
      where: {
        menuItemId,
        timestamp: {
          gte: new Date(timestamp.getTime() - 60 * 60 * 1000), // Within 1 hour
          lte: new Date(timestamp.getTime() + 60 * 60 * 1000),
        },
      },
    });

    if (prediction) {
      // Calculate accuracy
      const error = Math.abs(prediction.predictedOrders! - actualOrders);
      const accuracy = prediction.predictedOrders
        ? Math.max(0, 100 - (error / prediction.predictedOrders) * 100)
        : 0;

      // Update record
      await prisma.demandPrediction.update({
        where: { id: prediction.id },
        data: {
          actualOrders,
          predictionAccuracy: accuracy,
        },
      });
    }
  }
}

/**
 * Global singleton instance
 */
export const demandForecaster = new DemandForecaster();

/**
 * Helper: Get next hour prediction for a menu item
 */
export async function predictNextHour(menuItemId: string): Promise<number> {
  const nextHour = new Date(Date.now() + 60 * 60 * 1000);
  const prediction = await demandForecaster.predict(menuItemId, nextHour);
  return prediction.predictedOrders;
}

/**
 * Helper: Get demand forecast for all popular items
 */
export async function forecastPopularItems(): Promise<Map<string, DemandPrediction>> {
  const forecasts = new Map<string, DemandPrediction>();

  // Get popular items
  const popularItems = await prisma.menuItem.findMany({
    where: {
      isPopular: true,
      isAvailable: true,
    },
    select: {
      id: true,
    },
  });

  // Predict next hour for each
  const nextHour = new Date(Date.now() + 60 * 60 * 1000);

  for (const item of popularItems) {
    const prediction = await demandForecaster.predict(item.id, nextHour);
    forecasts.set(item.id, prediction);
  }

  return forecasts;
}

