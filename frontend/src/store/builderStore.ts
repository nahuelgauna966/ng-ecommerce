import { create } from 'zustand';

import type { ComponentType, Product } from '../services/api';

export const REQUIRED_COMPONENTS: ComponentType[] = [
  'cpu',
  'motherboard',
  'ram',
  'gpu',
  'psu',
];

export const OPTIONAL_COMPONENTS: ComponentType[] = ['case', 'cooler', 'storage'];

interface BuilderState {
  currentStep: number;
  selectedProducts: Partial<Record<ComponentType, Product>>;
  selectProduct: (componentType: ComponentType, product: Product) => void;
  setStep: (step: number) => void;
  removeProduct: (componentType: ComponentType) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  currentStep: 0,
  selectedProducts: {},
  selectProduct: (componentType, product) =>
    set((state) => {
      if (state.selectedProducts[componentType]?.id === product.id) {
        const requiredIndex = REQUIRED_COMPONENTS.indexOf(componentType);
        return requiredIndex === -1
          ? state
          : { ...state, currentStep: Math.min(requiredIndex + 1, REQUIRED_COMPONENTS.length) };
      }

      const selectedProducts = { ...state.selectedProducts, [componentType]: product };
      const requiredIndex = REQUIRED_COMPONENTS.indexOf(componentType);
      if (requiredIndex !== -1) {
        for (const dependentType of REQUIRED_COMPONENTS.slice(requiredIndex + 1)) {
          delete selectedProducts[dependentType];
        }
      }
      return {
        selectedProducts,
        currentStep: requiredIndex === -1
          ? state.currentStep
          : Math.min(requiredIndex + 1, REQUIRED_COMPONENTS.length),
      };
    }),
  setStep: (step) => set({ currentStep: Math.max(0, Math.min(step, REQUIRED_COMPONENTS.length)) }),
  removeProduct: (componentType) =>
    set((state) => {
      const selectedProducts = { ...state.selectedProducts };
      delete selectedProducts[componentType];
      const requiredIndex = REQUIRED_COMPONENTS.indexOf(componentType);
      if (requiredIndex !== -1) {
        for (const dependentType of REQUIRED_COMPONENTS.slice(requiredIndex + 1)) {
          delete selectedProducts[dependentType];
        }
      }
      return {
        selectedProducts,
        currentStep: requiredIndex === -1 ? state.currentStep : requiredIndex,
      };
    }),
  reset: () => set({ currentStep: 0, selectedProducts: {} }),
}));
