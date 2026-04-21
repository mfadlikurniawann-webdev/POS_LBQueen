"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
  image_url: string | null;
  is_consultation: boolean;
  voucher_discount: number;
  is_set: boolean;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: any, qty: number) => void;
  removeFromCart: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
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

  const addToCart = (product: any, qty: number) => {
    const isConsultation = qty > 10;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty, is_consultation: (i.qty + qty) > 10 } : i);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.selling_price,
        qty: qty,
        image_url: product.image_url,
        is_consultation: isConsultation,
        voucher_discount: product.voucher_discount || 0,
        is_set: product.is_set || false
      }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQty = (id: number, qty: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty, is_consultation: qty > 10 } : i));
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
