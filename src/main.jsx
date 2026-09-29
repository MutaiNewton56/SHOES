import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const API_URL = 'http://localhost:5000';



function App() {
  const [products, setProducts] = React.useState([]);
  const [productsLoading, setProductsLoading] = React.useState(true);
  const [productsError, setProductsError] = React.useState('');

  const [cart, setCart] = React.useState([]);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);

  const [customer, setCustomer] = React.useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [orderStatus, setOrderStatus] = React.useState('');

  const [messageForm, setMessageForm] = React.useState({
    name: '',
    email: '',
    message: '',
  });

  const [messageStatus, setMessageStatus] = React.useState('');

  async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}/api/products`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Could not load products.');
    }

    setProducts(data);
    setProductsError('');
  } catch (error) {
    console.error('Product loading error:', error);
    setProductsError(
      'Could not load products. Please try again later.'
    );
  } finally {
    setProductsLoading(false);
  }
}

React.useEffect(() => {
  loadProducts();
}, []);
  function addToCart(product, size) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) =>
          item.productId === product.id &&
          item.size === Number(size)
      );

      const currentQuantity = existing
        ? existing.quantity
        : 0;

      const availableStock = Number(product.stock);
  
      if (currentQuantity >= availableStock) {
        return currentCart;
      }
  
      if (existing) {
        return currentCart.map((item) =>
          item.productId === product.id &&
          item.size === Number(size)
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          size: Number(size),
          quantity: 1,
        },
      ];
    });
  }


  function updateQuantity(productId, size, change) {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.productId !== productId || item.size !== size) {
            return item;
          }
  
          const product = products.find(
            (p) => p.id === productId
          );
  
          const availableStock = product
            ? Number(product.stock)
            : 0;
  
          const newQuantity = item.quantity + change;
  
          if (newQuantity > availableStock) {
            return item;
          }
  
          return {
            ...item,
            quantity: newQuantity,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }
  
  function removeFromCart(productId, size) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => !(item.productId === productId && item.size === size)
      )
    );
  }

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  async function placeOrder(e) {
    e.preventDefault();

    if (cart.length === 0) {
      setOrderStatus('Your cart is empty.');
      return;
    }

    setOrderStatus('Placing order...');

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer,
          items: cart.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOrderStatus(data.message || 'Could not place order.');
        return;
      }

      setOrderStatus(
        `Order #${data.order.id} placed successfully! Total: KSh ${Number(
          data.order.total
        ).toLocaleString()}`
      );
      await loadProducts();

      setCart([]);

      setCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
      });
    } catch {
      setOrderStatus(
        'Could not connect to the backend. Is the server running?'
      );
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    setMessageStatus('Sending...');

    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageForm),
      });

      const data = await res.json();

      setMessageStatus(data.message || 'Message sent.');

      if (res.ok) {
        setMessageForm({
          name: '',
          email: '',
          message: '',
        });
      }
    } catch {
      setMessageStatus(
        'Could not connect to the backend. Is the server running?'
      );
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a
            href="#"
            className="text-2xl font-black tracking-tight text-neutral-950"
          >
            Asili<span className="text-neutral-500">Kicks</span>
          </a>

          <nav className="flex items-center gap-3 sm:gap-6">
            <a
              href="#shop"
              className="hidden text-sm font-semibold text-neutral-600 transition hover:text-black sm:inline"
            >
              Shop
            </a>

            <a
              href="#contact"
              className="hidden text-sm font-semibold text-neutral-600 transition hover:text-black sm:inline"
            >
              Contact
            </a>

            <button
              onClick={() => setCheckoutOpen(true)}
              className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-neutral-800 hover:shadow-md active:scale-95"
            >
              Cart ({cartCount})
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-neutral-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_35%)]" />

          <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10">
            <div className="max-w-2xl">
              <p className="mb-5 text-sm font-bold uppercase tracking-[0.3em] text-neutral-400">
                Step into style
              </p>

              <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                Shoes made
                <br />
                for your
                <br />
                <span className="text-neutral-400">every step.</span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-neutral-400 sm:text-lg">
                Discover comfortable, stylish footwear designed for everyday life.
                Find your next favourite pair at Asili Kicks.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <a
                  href="#shop"
                  className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-neutral-950 transition hover:bg-neutral-200 active:scale-95"
                >
                  Shop shoes
                </a>

                <a
                  href="#contact"
                  className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  Contact us
                </a>
              </div>

              <div className="mt-12 flex flex-wrap gap-8 border-t border-white/10 pt-7">
                <div>
                  <p className="text-2xl font-black">100%</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Quality focused
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-black">Easy</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Online ordering
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-black">Fast</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Simple checkout
                  </p>
                </div>
              </div>
            </div>

            <div className="relative hidden h-[480px] lg:block">
              <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full border border-white/10" />

              <div className="absolute right-10 top-1/2 flex h-[340px] w-[340px] -translate-y-1/2 rotate-[-8deg] items-center justify-center rounded-[3rem] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-8xl">👟</div>
                  <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-neutral-400">
                    Asili Kicks
                  </p>
                </div>
              </div>

              <div className="absolute bottom-8 left-0 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md">
                <p className="text-xs uppercase tracking-widest text-neutral-500">
                  New collection
                </p>
                <p className="mt-1 font-bold">Find your pair.</p>
              </div>
            </div>
          </div>
        </section>
	
	      <section id="shop" className="bg-[#f8f8f6] px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">
                  The collection
                </p>

                <h2 className="text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
                  Featured shoes
                </h2>

                <p className="mt-3 max-w-xl text-neutral-500">
                  Everyday footwear selected for comfort, style, and easy living.
                </p>
              </div>

                            <span className="text-sm font-semibold text-neutral-400">
                {products.length} {products.length === 1 ? 'style' : 'styles'}
              </span>
            </div>

            {productsLoading && (
              <p className="text-neutral-500">Loading shoes...</p>
            )}

            {productsError && (
              <p className="text-red-600">{productsError}</p>
            )}

            {!productsLoading && !productsError && products.length === 0 && (
              <p className="text-neutral-500">
                No shoes are currently available.
              </p>
            )}

            {!productsLoading && !productsError && products.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {cart.length > 0 && (
          <section className="bg-white px-5 py-16 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">
                    Your cart
                  </p>

                  <h2 className="text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
                    Ready to checkout?
                  </h2>
                </div>

                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="rounded-xl bg-neutral-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-neutral-800 active:scale-[0.98]"
                >
                  Checkout
                </button>
              </div>

              <Cart
                cart={cart}
                products={products}
                total={cartTotal}
                onUpdate={updateQuantity}
                onRemove={removeFromCart}
              />
            </div>
          </section>
        )}

        {checkoutOpen && (
          <section className="bg-[#f8f8f6] px-5 py-16 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-4xl">
              <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-5 border-b border-neutral-100 p-6 sm:flex-row sm:items-center sm:p-8">
                  <div>
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">
                      Checkout
                    </p>

                    <h2 className="text-3xl font-black tracking-tight text-neutral-950">
                      Complete your order
                    </h2>

                    <p className="mt-2 text-sm text-neutral-500">
                      Enter your delivery details below.
                    </p>
                  </div>

                  <button
                    className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-bold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                    onClick={() => setCheckoutOpen(false)}
                  >
                    Close
                  </button>
                </div>

                <div className="p-6 sm:p-8">
                  <Cart
                    cart={cart}
                    products={products}
                    total={cartTotal}
                    onUpdate={updateQuantity}
                    onRemove={removeFromCart}
                  />

                  <form className="mt-8 space-y-5" onSubmit={placeOrder}>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-neutral-800">
                        Full name
                      </label>

                      <input
                        value={customer.name}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            name: e.target.value,
                          })
                        }
                        placeholder="Your full name"
                        required
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-neutral-800">
                        Email address
                      </label>

                      <input
                        type="email"
                        value={customer.email}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            email: e.target.value,
                          })
                        }
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-neutral-800">
                        Phone number
                      </label>

                      <input
                        value={customer.phone}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            phone: e.target.value,
                          })
                        }
                        placeholder="07XX XXX XXX"
                        required
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-neutral-800">
                        Delivery address
                      </label>

                      <textarea
                        value={customer.address}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            address: e.target.value,
                          })
                        }
                        placeholder="Enter your delivery address"
                        required
                        rows="4"
                        className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={cart.length === 0}
                      className="w-full rounded-xl bg-neutral-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                      Place order — KSh {cartTotal.toLocaleString()}
                    </button>

                    {orderStatus && (
                      <p className="text-center text-sm font-semibold text-neutral-600">
                        {orderStatus}
                      </p>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="contact" className="bg-neutral-950 px-5 py-20 text-white sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-neutral-400">
                Contact us
              </p>

              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                Have a question?
              </h2>

              <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-400">
                Need help choosing a shoe, checking availability, or placing an
                order? Send us a message and we'll get back to you.
              </p>
            </div>

            <form
              className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8"
              onSubmit={sendMessage}
            >
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-200">
                    Name
                  </label>

                  <input
                    value={messageForm.name}
                    onChange={(e) =>
                      setMessageForm({
                        ...messageForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="Your name"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3.5 text-sm text-white outline-none placeholder:text-neutral-500 transition focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-200">
                    Email address
                  </label>

                  <input
                    type="email"
                    value={messageForm.email}
                    onChange={(e) =>
                      setMessageForm({
                        ...messageForm,
                        email: e.target.value,
                      })
                    }
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3.5 text-sm text-white outline-none placeholder:text-neutral-500 transition focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-neutral-200">
                    Message
                  </label>

                  <textarea
                    value={messageForm.message}
                    onChange={(e) =>
                      setMessageForm({
                        ...messageForm,
                        message: e.target.value,
                      })
                    }
                    placeholder="How can we help?"
                    required
                    rows="5"
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3.5 text-sm text-white outline-none placeholder:text-neutral-500 transition focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-white px-6 py-4 text-sm font-bold text-neutral-950 transition hover:bg-neutral-200 active:scale-[0.98]"
                >
                  Send message
                </button>

                {messageStatus && (
                  <p className="text-center text-sm font-semibold text-neutral-300">
                    {messageStatus}
                  </p>
                )}
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800 bg-neutral-950 px-5 py-8 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-lg font-black tracking-tight">
              Asili<span className="text-neutral-500">Kicks</span>
            </p>

            <p className="mt-1 text-sm text-neutral-500">
              Step into style.
            </p>
          </div>

          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} Asili Kicks. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}

function ProductCard({ product, onAdd }) {
  const [size, setSize] = React.useState(
    product.sizes[0]?.toString() || ''
  );

  const stock = Number(product.stock);
  const isOutOfStock = stock <= 0;

  function handleAdd() {
    if (isOutOfStock) return;
    onAdd(product, size);
  }

  return (
    <article className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Product image */}
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-100 via-neutral-200 to-neutral-300">
            <div className="text-center">
              <div className="text-7xl transition duration-500 group-hover:scale-110">
                👟
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-neutral-400">
                Asili Kicks
              </p>
            </div>
          </div>
        )}

        {/* Stock badge */}
        <div className="absolute left-4 top-4">
          {isOutOfStock ? (
            <span className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
              Out of stock
            </span>
          ) : stock <= 5 ? (
            <span className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold text-neutral-950 shadow-sm">
              Only {stock} left
            </span>
          ) : (
            <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-neutral-900 shadow-sm backdrop-blur">
              In stock
            </span>
          )}
        </div>
      </div>

      {/* Product information */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-neutral-950">
              {product.name}
            </h3>

            {product.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
                {product.description}
              </p>
            )}
          </div>

          <p className="shrink-0 text-lg font-black text-neutral-950">
            KSh {Number(product.price).toLocaleString()}
          </p>
        </div>

        {/* Size selector */}
        <div className="mt-6">
          <label
            htmlFor={`size-${product.id}`}
            className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500"
          >
            Select size
          </label>

          <select
            id={`size-${product.id}`}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            disabled={isOutOfStock}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {product.sizes.map((shoeSize) => (
              <option key={shoeSize} value={shoeSize}>
                Size {shoeSize}
              </option>
            ))}
          </select>
        </div>

        {/* Stock information */}
        <div className="mt-4">
          {stock > 5 && (
            <p className="text-xs font-semibold text-emerald-600">
              {stock} pairs available
            </p>
          )}

          {stock > 0 && stock <= 5 && (
            <p className="text-xs font-bold text-amber-600">
              Only {stock} pairs remaining
            </p>
          )}

          {isOutOfStock && (
            <p className="text-xs font-bold text-red-600">
              This product is currently unavailable
            </p>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className="mt-5 w-full rounded-xl bg-neutral-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isOutOfStock ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}

    

function Cart({ cart, products, total, onUpdate, onRemove }) {
  if (cart.length === 0) {
    return <p>Your cart is empty.</p>;
  }

  return (
    <div className="cart">
      {cart.map((item) => (
        <div
          className="cart-item"
          key={`${item.productId}-${item.size}`}
        >
          <div>
            <strong>{item.name}</strong>
            <p>
              Size {item.size} · KSh {item.price.toLocaleString()}
            </p>
          </div>

          <div className="quantity-controls">
            <button
              onClick={() =>
                onUpdate(item.productId, item.size, -1)
              }
            >
              −
            </button>

            <span>{item.quantity}</span>
            <button
              onClick={() =>
                onUpdate(item.productId, item.size, 1)
              }
              disabled={
                item.quantity >=
                Number(
                  products?.find((p) => p.id === item.productId)?.stock || 0
                )
              }
            >
              +
            </button>
          </div>

          <strong>
            KSh {(item.price * item.quantity).toLocaleString()}
          </strong>

          <button
            className="remove-button"
            onClick={() =>
              onRemove(item.productId, item.size)
            }
          >
            Remove
          </button>
        </div>
      ))}

      <div className="cart-total">
        <strong>Total</strong>
        <strong>KSh {total.toLocaleString()}</strong>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
