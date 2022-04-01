import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      try {
        const productsSave = await AsyncStorage.getItem('@product');

        if (productsSave) {
          const productsSaveParser = JSON.parse(productsSave) as Product[];

          setProducts(productsSaveParser);
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadProducts();
  }, []);

  async function saveLocalProducts(newProducts: Product[]): Promise<void> {
    try {
      await AsyncStorage.setItem('@product', JSON.stringify(newProducts));
    } catch (e) {
      console.error(e);
    }
  }

  const addToCart = useCallback(
    async (product: Product) => {
      const existProductInCart = products.filter(p => p.id === product.id);

      if (existProductInCart.length > 0) {
        const productsUpdate = products.map(productCart => {
          if (product.id === productCart.id) {
            return {
              ...productCart,
              quantity: productCart.quantity + 1,
            };
          }

          return productCart;
        });

        setProducts(productsUpdate);
        saveLocalProducts(productsUpdate);
      } else {
        const newProductInCart: Product = {
          ...product,
          quantity: 1,
        };

        const productsToSave = [...products, newProductInCart];

        setProducts(productsToSave);
        saveLocalProducts(productsToSave);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsUpdate = products.map(productCart => {
        if (id === productCart.id) {
          return {
            ...productCart,
            quantity: productCart.quantity + 1,
          };
        }

        return productCart;
      });

      setProducts(productsUpdate);
      saveLocalProducts(productsUpdate);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      let removeFromCart = false;

      products.forEach(productCart => {
        if (id === productCart.id && productCart.quantity <= 1) {
          removeFromCart = true;
        }
      });

      if (removeFromCart) {
        const productsUpdate = products.filter(
          productCart => id !== productCart.id,
        );

        setProducts(productsUpdate);
        saveLocalProducts(productsUpdate);
      } else {
        const productsUpdate = products.map(productCart => {
          if (id === productCart.id) {
            return {
              ...productCart,
              quantity: productCart.quantity - 1,
            };
          }

          return productCart;
        });

        setProducts(productsUpdate);
        saveLocalProducts(productsUpdate);
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
