import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryService } from './service';
import { RequestContext } from '@/server/core/RequestContext';
import { InventoryRepository } from './repository';
import { eventBus } from '@/server/events/InMemoryEventBus';

vi.mock('./repository');
vi.mock('@/server/events/InMemoryEventBus', () => ({
  eventBus: {
    publish: vi.fn(),
  }
}));

describe('InventoryService - adjustStock', () => {
  let service: InventoryService;
  let mockCtx: RequestContext;
  let mockRepo: any;

  beforeEach(() => {
    mockCtx = {
      userId: 'user-1',
      companyId: 'company-1',
      role: 'ADMIN',
      permissions: ['inventory:write'],
      requestId: 'req-1',
      timestamp: new Date(),
    };
    service = new InventoryService(mockCtx);
    mockRepo = service['repository'] as any;
  });

  it('should successfully add stock', async () => {
    const mockItem = {
      id: 'item-1',
      currentStock: 10,
      availableQuantity: 10,
      reservedQuantity: 0,
      reorderLevel: 5,
      deletedAt: null
    };

    mockRepo.findById.mockResolvedValue(mockItem as any);
    mockRepo.update.mockResolvedValue({ ...mockItem, currentStock: 15, availableQuantity: 15, status: 'AVAILABLE' } as any);
    mockRepo.recordAdjustment.mockResolvedValue({} as any);
    mockRepo.recordHistory.mockResolvedValue({} as any);

    const input = {
      itemId: 'item-1',
      type: 'ADD' as any,
      quantity: 5,
      reason: 'RESTOCK'
    };

    const result = await service.adjustStock(input);

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.currentStock).toBe(15);
    }
    
    expect(mockRepo.update).toHaveBeenCalledWith('item-1', 'company-1', expect.objectContaining({
      currentStock: 15,
      availableQuantity: 15,
      status: 'AVAILABLE'
    }));
    expect(eventBus.publish).toHaveBeenCalled();
  });

  it('should fail if adjustment results in negative stock', async () => {
    const mockItem = {
      id: 'item-1',
      currentStock: 10,
      availableQuantity: 10,
      reservedQuantity: 0,
      reorderLevel: 5,
      deletedAt: null
    };

    mockRepo.findById.mockResolvedValue(mockItem as any);

    const input = {
      itemId: 'item-1',
      type: 'REMOVE' as any,
      quantity: 15,
      reason: 'DAMAGE'
    };

    const result = await service.adjustStock(input);

    expect(result.isFailure()).toBe(true);
    if (result.isFailure()) {
      expect(result.error.message).toContain('negative stock');
    }
  });

  it('should evaluate low stock status correctly', async () => {
    const mockItem = {
      id: 'item-1',
      currentStock: 10,
      availableQuantity: 10,
      reservedQuantity: 0,
      reorderLevel: 5,
      deletedAt: null
    };

    mockRepo.findById.mockResolvedValue(mockItem as any);
    mockRepo.update.mockResolvedValue({} as any);
    mockRepo.recordAdjustment.mockResolvedValue({} as any);
    mockRepo.recordHistory.mockResolvedValue({} as any);

    // Drop stock to exactly reorder level
    await service.adjustStock({
      itemId: 'item-1',
      type: 'REMOVE' as any,
      quantity: 5,
      reason: 'CORRECTION'
    });

    expect(mockRepo.update).toHaveBeenCalledWith('item-1', 'company-1', expect.objectContaining({
      status: 'LOW_STOCK'
    }));
  });
});
