 
import { 
  getOrCreateCustomer, 
  findExistingSubscription, 
  lookupDiscount,
  getPriceForInterval
} from '../stripe-service';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

// Mock Stripe SDK
jest.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      retrieve: jest.fn(),
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    subscriptions: {
      list: jest.fn(),
    },
    promotionCodes: {
      list: jest.fn(),
    },
    coupons: {
      retrieve: jest.fn(),
    },
    prices: {
      retrieve: jest.fn(),
      list: jest.fn(),
    },
  },
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  team: {
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
}));

const mockStripe = stripe as jest.Mocked<typeof stripe>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('stripe-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateCustomer', () => {
    const mockTeam = {
      id: 'team-123',
      name: 'Test Team',
      stripeCustomerId: null,
    };

    it('returns existing valid customer from DB', async () => {
      const teamWithCustomer = { ...mockTeam, stripeCustomerId: 'cus_existing' };
      (mockPrisma.team.findUniqueOrThrow as jest.Mock).mockResolvedValue(teamWithCustomer);
      (mockStripe.customers.retrieve as jest.Mock).mockResolvedValue({ id: 'cus_existing', deleted: false });

      const result = await getOrCreateCustomer('team-123', 'test@example.com');

      expect(result.customerId).toBe('cus_existing');
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('creates new customer when none exists', async () => {
      (mockPrisma.team.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockTeam);
      (mockStripe.customers.list as jest.Mock).mockResolvedValue({ data: [] });
      (mockStripe.customers.create as jest.Mock).mockResolvedValue({ id: 'cus_new' });
      (mockPrisma.team.update as jest.Mock).mockResolvedValue({});

      const result = await getOrCreateCustomer('team-123', 'test@example.com');

      expect(result.customerId).toBe('cus_new');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test Team',
        metadata: { teamId: 'team-123' },
      });
    });

    it('finds and links existing customer by email', async () => {
      (mockPrisma.team.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockTeam);
      (mockStripe.customers.list as jest.Mock).mockResolvedValue({
        data: [{ id: 'cus_found', metadata: { teamId: 'team-123' } }],
      });
      (mockPrisma.team.update as jest.Mock).mockResolvedValue({});

      const result = await getOrCreateCustomer('team-123', 'test@example.com');

      expect(result.customerId).toBe('cus_found');
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('handles deleted customer by creating new one', async () => {
      const teamWithDeletedCustomer = { ...mockTeam, stripeCustomerId: 'cus_deleted' };
      (mockPrisma.team.findUniqueOrThrow as jest.Mock).mockResolvedValue(teamWithDeletedCustomer);
      (mockStripe.customers.retrieve as jest.Mock).mockResolvedValue({ id: 'cus_deleted', deleted: true });
      (mockStripe.customers.list as jest.Mock).mockResolvedValue({ data: [] });
      (mockStripe.customers.create as jest.Mock).mockResolvedValue({ id: 'cus_replacement' });
      (mockPrisma.team.update as jest.Mock).mockResolvedValue({});

      const result = await getOrCreateCustomer('team-123', 'test@example.com');

      expect(result.customerId).toBe('cus_replacement');
    });
  });

  describe('findExistingSubscription', () => {
    it('returns active subscription when found', async () => {
      const mockSub = { id: 'sub_active', status: 'active' };
      (mockStripe.subscriptions.list as jest.Mock).mockResolvedValue({
        data: [mockSub],
      });

      const result = await findExistingSubscription('cus_123');

      expect(result).toEqual(mockSub);
    });

    it('prioritizes active over incomplete', async () => {
      const activeSub = { id: 'sub_active', status: 'active' };
      const incompleteSub = { id: 'sub_incomplete', status: 'incomplete' };
      (mockStripe.subscriptions.list as jest.Mock).mockResolvedValue({
        data: [incompleteSub, activeSub],
      });

      const result = await findExistingSubscription('cus_123');

      expect(result?.id).toBe('sub_active');
    });

    it('returns null when no subscriptions', async () => {
      (mockStripe.subscriptions.list as jest.Mock).mockResolvedValue({ data: [] });

      const result = await findExistingSubscription('cus_123');

      expect(result).toBeNull();
    });
  });

  describe('lookupDiscount', () => {
    it('returns promotion code object when found', async () => {
      (mockStripe.promotionCodes.list as jest.Mock).mockResolvedValue({
        data: [{ id: 'promo_123' }],
      });

      const result = await lookupDiscount('SAVE20');

      expect(result).toEqual({ type: 'promotion_code', id: 'promo_123' });
    });

    it('returns null when returning unknown code', async () => {
        (mockStripe.promotionCodes.list as jest.Mock).mockResolvedValue({ data: [] });
        // Mock coupon retrieve to fail for invalid coupon check
        (mockStripe.coupons.retrieve as jest.Mock).mockRejectedValue({ code: 'resource_missing' });
  
        const result = await lookupDiscount('INVALID');
  
        expect(result).toBeNull();
      });

    it('returns coupon object when direct coupon ID is found', async () => {
        (mockStripe.promotionCodes.list as jest.Mock).mockResolvedValue({ data: [] });
        (mockStripe.coupons.retrieve as jest.Mock).mockResolvedValue({ id: 'coupon_123', valid: true });
  
        const result = await lookupDiscount('coupon_123');
  
        expect(result).toEqual({ type: 'coupon', id: 'coupon_123' });
      });
  });

  describe('getPriceForInterval', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv, STRIPE_PRO_PRICE_ID: 'price_base' };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('returns matching price for year interval', async () => {
      const yearlyPrice = { id: 'price_yearly', recurring: { interval: 'year' } };
      (mockStripe.prices.retrieve as jest.Mock).mockResolvedValue({ product: 'prod_123' });
      (mockStripe.prices.list as jest.Mock).mockResolvedValue({
        data: [yearlyPrice, { id: 'price_monthly', recurring: { interval: 'month' } }],
      });

      const result = await getPriceForInterval('year');

      expect(result.id).toBe('price_yearly');
    });

    it('throws error when no matching price', async () => {
      (mockStripe.prices.retrieve as jest.Mock).mockResolvedValue({ product: 'prod_123' });
      (mockStripe.prices.list as jest.Mock).mockResolvedValue({ data: [] });

      await expect(getPriceForInterval('year')).rejects.toThrow('No price found');
    });

    it('works when STRIPE_PRO_PRICE_ID is a Product ID', async () => {
      process.env.STRIPE_PRO_PRICE_ID = 'prod_direct';
      const yearlyPrice = { id: 'price_yearly', recurring: { interval: 'year' } };
      (mockStripe.prices.list as jest.Mock).mockResolvedValue({
        data: [yearlyPrice],
      });

      const result = await getPriceForInterval('year');

      expect(result.id).toBe('price_yearly');
      expect(mockStripe.prices.retrieve).not.toHaveBeenCalled();
      expect(mockStripe.prices.list).toHaveBeenCalledWith(expect.objectContaining({ product: 'prod_direct' }));
    });
  });
});
