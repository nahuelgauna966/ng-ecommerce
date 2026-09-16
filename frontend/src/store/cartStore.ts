import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Product } from '../services/api';

export interface CartItem {
  productId: number;
  name: string;
  price: string;
  quantity: number;
  imageUrl: string | null;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

function getMaxStock(product: Product): number {
  return Math.max(0, product.stock?.quantity ?? 0);
}

function clampQuantity(quantity: number, maxStock: number): number {
  return Math.min(Math.max(0, quantity), maxStock);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity) => {
        const maxStock = getMaxStock(product);
        const quantityToAdd = clampQuantity(quantity, maxStock);

        if (quantityToAdd === 0) {
          return;
        }

        set((state) => {
          const existingItem = state.items.find(
            (item) => item.productId === product.id,
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? {
                      ...item,
                      maxStock,
                      quantity: clampQuantity(
                        item.quantity + quantityToAdd,
                        maxStock,
                      ),
                    }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: quantityToAdd,
                imageUrl: product.imageUrl,
                maxStock,
              },
            ],
          };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        set((state) => {
          const item = state.items.find(
            (cartItem) => cartItem.productId === productId,
          );
          if (!item) {
            return state;
          }

          const nextQuantity = clampQuantity(quantity, item.maxStock);
          if (nextQuantity === 0) {
            return {
              items: state.items.filter(
                (cartItem) => cartItem.productId !== productId,
              ),
            };
          }

          return {
            items: state.items.map((cartItem) =>
              cartItem.productId === productId
                ? { ...cartItem, quantity: nextQuantity }
                : cartItem,
            ),
          };
        });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
      totalPrice: () =>
        get().items.reduce(
          (total, item) => total + Number(item.price) * item.quantity,
          0,
        ),
    }),
    {
      name: 'cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
