import type { ComponentType } from 'react';
import type { LayoutId, SlotBudget } from '../schema';
import type { Slide } from '../schema/deck';

export type LayoutProps = {
  slide: Slide;
};

export type LayoutDefinition = {
  id: LayoutId;
  label: string;
  requiredSlots: string[];
  budgets: Record<string, SlotBudget>;
  component: ComponentType<LayoutProps>;
};
