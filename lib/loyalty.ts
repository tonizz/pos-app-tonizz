import { prisma } from './prisma'

// Loyalty Program Configuration
export const LOYALTY_CONFIG = {
  // Points earning rate: Rp 1000 = 1 point
  POINTS_PER_1000: 1,

  // Member tier thresholds (based on total spent)
  TIERS: {
    BRONZE: { min: 0, discount: 0, name: 'Bronze' },
    SILVER: { min: 1000000, discount: 5, name: 'Silver' }, // Rp 1jt
    GOLD: { min: 5000000, discount: 10, name: 'Gold' },    // Rp 5jt
    PLATINUM: { min: 10000000, discount: 15, name: 'Platinum' } // Rp 10jt
  },

  // Point redemption: 100 points = Rp 10,000 discount
  POINTS_TO_RUPIAH: 100,

  // Birthday bonus
  BIRTHDAY_BONUS_POINTS: 100,

  // Referral bonus
  REFERRAL_BONUS_POINTS: 50,
  REFERRED_BONUS_POINTS: 50
}

// Calculate points from purchase amount
export function calculatePoints(amount: number): number {
  return Math.floor(amount / 1000) * LOYALTY_CONFIG.POINTS_PER_1000
}

// Calculate discount from points
export function calculateDiscountFromPoints(points: number): number {
  return Math.floor(points / LOYALTY_CONFIG.POINTS_TO_RUPIAH) * 10000
}

// Determine member tier based on total spent
export function determineMemberTier(totalSpent: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
  if (totalSpent >= LOYALTY_CONFIG.TIERS.PLATINUM.min) return 'PLATINUM'
  if (totalSpent >= LOYALTY_CONFIG.TIERS.GOLD.min) return 'GOLD'
  if (totalSpent >= LOYALTY_CONFIG.TIERS.SILVER.min) return 'SILVER'
  return 'BRONZE'
}

// Get tier discount percentage
export function getTierDiscount(tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'): number {
  return LOYALTY_CONFIG.TIERS[tier].discount
}

// Add points to customer
export async function addPoints(
  customerId: string,
  points: number,
  type: 'EARN' | 'BONUS' | 'ADJUST',
  description: string,
  reference?: string
) {
  await prisma.$transaction(async (tx) => {
    // Update customer points
    await tx.customer.update({
      where: { id: customerId },
      data: { points: { increment: points } }
    })

    // Create point transaction record
    await tx.pointTransaction.create({
      data: {
        customerId,
        type,
        points,
        description,
        reference
      }
    })
  })
}

// Redeem points for discount
export async function redeemPoints(
  customerId: string,
  points: number,
  reference: string
) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  })

  if (!customer) {
    throw new Error('Customer not found')
  }

  if (customer.points < points) {
    throw new Error('Insufficient points')
  }

  const discount = calculateDiscountFromPoints(points)

  await prisma.$transaction(async (tx) => {
    // Deduct customer points
    await tx.customer.update({
      where: { id: customerId },
      data: { points: { decrement: points } }
    })

    // Create point transaction record
    await tx.pointTransaction.create({
      data: {
        customerId,
        type: 'REDEEM',
        points: -points,
        description: `Redeemed ${points} points for Rp ${discount.toLocaleString()} discount`,
        reference
      }
    })
  })

  return discount
}

// Update member tier based on total spent
export async function updateMemberTier(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  })

  if (!customer) return

  const newTier = determineMemberTier(customer.totalSpent)

  if (newTier !== customer.memberTier) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { memberTier: newTier }
    })

    // Log tier upgrade
    await prisma.auditLog.create({
      data: {
        userId: customerId,
        action: 'TIER_UPGRADE',
        entity: 'Customer',
        entityId: customerId,
        details: `Member tier upgraded from ${customer.memberTier} to ${newTier}`
      }
    })
  }
}

// Generate unique referral code
export async function generateReferralCode(customerName: string): Promise<string> {
  const base = customerName.substring(0, 3).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const code = `${base}${random}`

  // Check if code already exists
  const existing = await prisma.customer.findUnique({
    where: { referralCode: code }
  })

  if (existing) {
    // Regenerate if exists
    return generateReferralCode(customerName)
  }

  return code
}

// Process referral bonus
export async function processReferral(newCustomerId: string, referralCode: string) {
  const referrer = await prisma.customer.findUnique({
    where: { referralCode }
  })

  if (!referrer) {
    throw new Error('Invalid referral code')
  }

  // Give bonus to referrer
  await addPoints(
    referrer.id,
    LOYALTY_CONFIG.REFERRAL_BONUS_POINTS,
    'BONUS',
    `Referral bonus for inviting new customer`,
    newCustomerId
  )

  // Give bonus to new customer
  await addPoints(
    newCustomerId,
    LOYALTY_CONFIG.REFERRED_BONUS_POINTS,
    'BONUS',
    `Welcome bonus for using referral code ${referralCode}`,
    referrer.id
  )

  // Update new customer's referredBy
  await prisma.customer.update({
    where: { id: newCustomerId },
    data: { referredBy: referrer.id }
  })
}

// Check and give birthday bonus
export async function checkBirthdayBonus(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  })

  if (!customer || !customer.birthday) return false

  const today = new Date()
  const birthday = new Date(customer.birthday)

  // Check if today is birthday (month and day match)
  if (
    today.getMonth() === birthday.getMonth() &&
    today.getDate() === birthday.getDate()
  ) {
    // Check if bonus already given this year
    const thisYear = today.getFullYear()
    const existingBonus = await prisma.pointTransaction.findFirst({
      where: {
        customerId,
        type: 'BONUS',
        description: { contains: 'Birthday bonus' },
        createdAt: {
          gte: new Date(thisYear, 0, 1),
          lt: new Date(thisYear + 1, 0, 1)
        }
      }
    })

    if (!existingBonus) {
      await addPoints(
        customerId,
        LOYALTY_CONFIG.BIRTHDAY_BONUS_POINTS,
        'BONUS',
        `Birthday bonus - Happy Birthday! 🎉`,
        `birthday-${thisYear}`
      )
      return true
    }
  }

  return false
}

// Get customer loyalty summary
export async function getCustomerLoyaltySummary(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      pointTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  if (!customer) {
    throw new Error('Customer not found')
  }

  const tierInfo = LOYALTY_CONFIG.TIERS[customer.memberTier]
  const nextTier = getNextTier(customer.memberTier)
  const nextTierInfo = nextTier ? LOYALTY_CONFIG.TIERS[nextTier] : null

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      memberTier: customer.memberTier,
      points: customer.points,
      totalSpent: customer.totalSpent,
      referralCode: customer.referralCode,
      birthday: customer.birthday
    },
    tier: {
      current: tierInfo.name,
      discount: tierInfo.discount,
      nextTier: nextTierInfo?.name,
      nextTierMin: nextTierInfo?.min,
      progressToNext: nextTierInfo ? customer.totalSpent / nextTierInfo.min * 100 : 100
    },
    points: {
      available: customer.points,
      canRedeem: Math.floor(customer.points / LOYALTY_CONFIG.POINTS_TO_RUPIAH) * 10000,
      pointsNeeded: LOYALTY_CONFIG.POINTS_TO_RUPIAH - (customer.points % LOYALTY_CONFIG.POINTS_TO_RUPIAH)
    },
    recentTransactions: customer.pointTransactions
  }
}

function getNextTier(currentTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'): 'SILVER' | 'GOLD' | 'PLATINUM' | null {
  switch (currentTier) {
    case 'BRONZE': return 'SILVER'
    case 'SILVER': return 'GOLD'
    case 'GOLD': return 'PLATINUM'
    case 'PLATINUM': return null
  }
}
