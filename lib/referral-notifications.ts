/**
 * REFERRAL NOTIFICATIONS - Smart Alerts for Viral Growth
 * 
 * Purpose: Send notifications for referral events
 * 
 * Features:
 * - Friend signs up notification
 * - Order delivered + reward credited notification
 * - Milestone jackpot notification
 * - Monthly champion notification
 * 
 * Channels: Email, SMS (future: WhatsApp, Push)
 */

import { logger } from '@/lib/logger';
import { sendEmailWithRetry } from '@/lib/email';

/**
 * Notify referrer when a friend signs up
 * 
 * @param referrerEmail - Referrer's email
 * @param referrerName - Referrer's name
 * @param friendName - Friend's name
 */
export async function notifyReferrerFriendSignup(
  referrerEmail: string,
  referrerName: string,
  friendName: string
): Promise<boolean> {
  try {
    const subject = '🎉 Your friend joined using your referral!';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Great News, ${referrerName}!</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          ${friendName} just signed up using your referral code! 🎉
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
          When they place their first order, you'll earn <strong>₹50</strong> in your wallet!
        </p>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          Keep sharing your code to unlock bigger rewards:
        </p>
        <ul style="font-size: 14px; color: #6b7280;">
          <li>5 referrals = ₹200-₹500 jackpot</li>
          <li>10 referrals = ₹500-₹1000 jackpot</li>
          <li>#1 each month = ₹5000 prize!</li>
        </ul>
        <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            💡 Tip: Share your code on WhatsApp groups for faster results!
          </p>
        </div>
      </div>
    `;

    await sendEmailWithRetry(referrerEmail, subject, body);
    
    logger.info('Referrer notified of friend signup', {
      referrerEmail,
      friendName,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send friend signup notification', {
      referrerEmail,
      friendName,
      error: error instanceof Error ? error.message : String(error),
    });

    return false;
  }
}

/**
 * Notify referrer when reward is credited after friend's order delivery
 * 
 * @param referrerEmail - Referrer's email
 * @param referrerName - Referrer's name
 * @param friendName - Friend's name
 * @param rewardAmount - Amount credited
 * @param walletBalance - New wallet balance
 */
export async function notifyReferrerRewardCredited(
  referrerEmail: string,
  referrerName: string,
  friendName: string,
  rewardAmount: number,
  walletBalance: number
): Promise<boolean> {
  try {
    const subject = '💰 ₹' + rewardAmount + ' credited to your wallet!';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Reward Credited! 💰</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          Hi ${referrerName},
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
          ${friendName} just completed their first order! As promised, we've credited 
          <strong>₹${rewardAmount}</strong> to your wallet.
        </p>
        <div style="margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; text-align: center;">
          <p style="color: white; font-size: 14px; margin: 0;">Your Wallet Balance</p>
          <p style="color: white; font-size: 32px; font-weight: bold; margin: 10px 0;">₹${walletBalance}</p>
          <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 0;">Ready to use on your next order!</p>
        </div>
        <p style="font-size: 16px; line-height: 1.6;">
          Your wallet credits will be available in <strong>24 hours</strong> (fraud prevention).
        </p>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          Keep referring to unlock jackpots! 🏆
        </p>
      </div>
    `;

    await sendEmailWithRetry(referrerEmail, subject, body);
    
    logger.info('Referrer notified of reward credit', {
      referrerEmail,
      rewardAmount,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send reward credit notification', {
      referrerEmail,
      rewardAmount,
      error: error instanceof Error ? error.message : String(error),
    });

    return false;
  }
}

/**
 * Notify customer of milestone jackpot
 * 
 * @param email - Customer's email
 * @param name - Customer's name
 * @param milestoneType - Type of milestone
 * @param jackpotAmount - Jackpot amount
 * @param referralCount - Number of referrals
 */
export async function notifyMilestoneJackpot(
  email: string,
  name: string,
  milestoneType: string,
  jackpotAmount: number,
  referralCount: number
): Promise<boolean> {
  try {
    const subject = '🏆 JACKPOT! You won ₹' + jackpotAmount + '!';
    
    const milestoneNames: Record<string, string> = {
      FIFTH_REFERRAL: '5 Referrals',
      TENTH_REFERRAL: '10 Referrals',
      TWENTIETH_REFERRAL: '20 Referrals',
    };

    const milestoneName = milestoneNames[milestoneType] || milestoneType;

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; font-size: 48px; margin: 0;">🏆</h1>
          <h2 style="color: white; font-size: 32px; margin: 20px 0 10px 0;">JACKPOT!</h2>
          <p style="color: rgba(255,255,255,0.95); font-size: 18px; margin: 0;">
            You've unlocked a mystery reward!
          </p>
        </div>
        <p style="font-size: 18px; line-height: 1.6;">
          🎉 Congratulations, ${name}!
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
          You've reached the <strong>${milestoneName}</strong> milestone! 
          As a reward, we've instantly credited <strong>₹${jackpotAmount}</strong> to your wallet!
        </p>
        <div style="margin: 30px 0; padding: 30px; background: #fef3c7; border-radius: 8px; text-align: center;">
          <p style="font-size: 16px; color: #92400e; margin: 0;">💰 Jackpot Amount</p>
          <p style="font-size: 42px; font-weight: bold; color: #92400e; margin: 10px 0;">₹${jackpotAmount}</p>
          <p style="font-size: 14px; color: #92400e; margin: 0;">Available immediately in your wallet!</p>
        </div>
        <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
          You've successfully referred ${referralCount} friends. Keep going to unlock even bigger rewards!
        </p>
        <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <p style="font-size: 14px; color: #374151; margin: 0 0 10px 0;"><strong>Next Milestones:</strong></p>
          <ul style="font-size: 14px; color: #6b7280; margin: 0; padding-left: 20px;">
            ${referralCount < 10 ? '<li>10 referrals = ₹500-₹1000 jackpot</li>' : ''}
            ${referralCount < 20 ? '<li>20 referrals = ₹1000-₹2000 jackpot</li>' : ''}
            <li>Be #1 this month = ₹5000 prize!</li>
          </ul>
        </div>
      </div>
    `;

    await sendEmailWithRetry(email, subject, body);
    
    logger.info('Milestone jackpot notification sent', {
      email,
      milestoneType,
      jackpotAmount,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send milestone jackpot notification', {
      email,
      milestoneType,
      jackpotAmount,
      error: error instanceof Error ? error.message : String(error),
    });

    return false;
  }
}

/**
 * Notify monthly champion
 * 
 * @param email - Champion's email
 * @param name - Champion's name
 * @param referralCount - Number of referrals this month
 * @param prize - Prize amount (₹5000)
 */
export async function notifyMonthlyChampion(
  email: string,
  name: string,
  referralCount: number,
  prize: number
): Promise<boolean> {
  try {
    const subject = '👑 YOU ARE THE REFERRAL CHAMPION!';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 50px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; font-size: 64px; margin: 0;">👑</h1>
          <h2 style="color: white; font-size: 36px; margin: 20px 0 10px 0;">CHAMPION!</h2>
          <p style="color: rgba(255,255,255,0.95); font-size: 20px; margin: 0;">
            You're #1 this month!
          </p>
        </div>
        <p style="font-size: 20px; line-height: 1.6; text-align: center;">
          🏆 <strong>Congratulations, ${name}!</strong> 🏆
        </p>
        <p style="font-size: 16px; line-height: 1.6; text-align: center;">
          You referred <strong>${referralCount} friends</strong> this month, 
          making you our top referrer!
        </p>
        <div style="margin: 40px 0; padding: 40px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; text-align: center;">
          <p style="font-size: 18px; color: white; margin: 0;">🎁 Your Champion Prize</p>
          <p style="font-size: 56px; font-weight: bold; color: white; margin: 15px 0;">₹${prize}</p>
          <p style="font-size: 16px; color: rgba(255,255,255,0.95); margin: 0;">Credited to your wallet!</p>
        </div>
        <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #6b7280;">
          You're a viral growth legend! Thank you for spreading the word about Bantu's Kitchen.
        </p>
        <div style="margin-top: 40px; padding: 30px; background: #f3f4f6; border-radius: 8px; text-align: center;">
          <p style="font-size: 14px; color: #374151; margin: 0;">
            Can you keep the crown next month? 👑
          </p>
        </div>
      </div>
    `;

    await sendEmailWithRetry(email, subject, body);
    
    logger.info('Monthly champion notification sent', {
      email,
      referralCount,
      prize,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send monthly champion notification', {
      email,
      referralCount,
      prize,
      error: error instanceof Error ? error.message : String(error),
    });

    return false;
  }
}

/**
 * Notify referee (friend) about their welcome discount
 * 
 * @param email - Referee's email
 * @param name - Referee's name
 * @param discountAmount - Discount amount
 * @param referrerName - Referrer's name
 */
export async function notifyRefereeWelcomeDiscount(
  email: string,
  name: string,
  discountAmount: number,
  referrerName: string
): Promise<boolean> {
  try {
    const subject = '🎁 Welcome! Get ₹' + discountAmount + ' off your first order';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580c;">Welcome to Bantu's Kitchen, ${name}! 🎉</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          ${referrerName} referred you, and we're excited to have you!
        </p>
        <div style="margin: 30px 0; padding: 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; text-align: center;">
          <p style="color: white; font-size: 16px; margin: 0;">Your Welcome Bonus</p>
          <p style="color: white; font-size: 42px; font-weight: bold; margin: 10px 0;">₹${discountAmount} OFF</p>
          <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">Applied automatically on your first order!</p>
        </div>
        <p style="font-size: 16px; line-height: 1.6;">
          No code needed! Just add items to your cart and checkout – your discount will 
          be applied automatically. ✨
        </p>
        <div style="text-align: center; margin: 40px 0;">
          <a href="https://bantuskitchen.com" style="display: inline-block; padding: 16px 32px; background: #ea580c; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Start Ordering
          </a>
        </div>
        <p style="font-size: 14px; color: #6b7280; text-align: center;">
          Pro tip: You get your own referral code too! Share it with friends to earn rewards.
        </p>
      </div>
    `;

    await sendEmailWithRetry(email, subject, body);
    
    logger.info('Referee welcome notification sent', {
      email,
      discountAmount,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send referee welcome notification', {
      email,
      discountAmount,
      error: error instanceof Error ? error.message : String(error),
    });

    return false;
  }
}

