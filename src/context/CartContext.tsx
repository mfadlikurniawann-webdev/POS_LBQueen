"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CartItem = {
  id: number;
  variant_id?: number;
  variant_name?: string;
  name: string;
  price: number;
  qty: number;
  image_url: string | null;
  is_consultation: boolean;
  voucher_discount: number;
  is_set: boolean;
  type?: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: any, qty: number, variant?: any) => void;
  removeFromCart: (id: number, variant_id?: number) => void;
  updateQty: (id: number, qty: number, variant_id?: number) => void;
  clearCart: () => void;
  totalItems: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("lbqueen_cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("lbqueen_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: any, qty: number, variant?: any) => {
    setCart(prev => {
      const variant_id = variant?.id;
      const existing = prev.find(i => i.id === product.id && i.variant_id === variant_id);
      if (existing) {
        const newQty = Math.min(10, existing.qty + qty);
        return prev.map(i => (i.id === product.id && i.variant_id === variant_id) ? { ...i, qty: newQty } : i);
      }
      return [...prev, {
        id: product.id,
        variant_id: variant_id,
        variant_name: variant?.variant_name,
        name: product.name,
        price: variant ? variant.price : product.selling_price,
        qty: Math.min(10, qty),
        image_url: product.image_url,
        is_consultation: false,
        voucher_discount: product.voucher_discount || 0,
        is_set: product.is_set || false,
        type: product.type
      }];
    });
  };

  const removeFromCart = (id: number, variant_id?: number) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.variant_id === variant_id)));
  };

  const updateQty = (id: number, qty: number, variant_id?: number) => {
    const cappedQty = Math.min(10, qty);
    setCart(prev => prev.map(i => (i.id === id && i.variant_id === variant_id) ? { ...i, qty: cappedQty, is_consultation: false } : i));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
