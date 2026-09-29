import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

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

  React.useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch(`${API_URL}/api/products`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Could not load products.');
        }

        setProducts(data);
      } catch (error) {
        console.error('Product loading error:', error);
        setProductsError(
          'Could not load products. Please try again later.'
        );
      } finally {
        setProductsLoading(false);
      }
    }

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
      <header>
        <strong>Asili Kicks</strong>

        <nav>
          <a href="#shop">Shop</a>
          <a href="#contact">Contact</a>
          <button
            className="cart-button"
            onClick={() => setCheckoutOpen(true)}
          >
            Cart ({cartCount})
          </button>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">STEP INTO STYLE</p>
            <h1>
              Quality shoes.
              <br />
              Simple shopping.
            </h1>
            <p>
              Browse our collection and order your next pair online.
            </p>
            <a className="button" href="#shop">
              Shop shoes
            </a>
          </div>
        </section>
	
	       <section id="shop">
	  <h2>Featured shoes</h2>
	
	  {productsLoading && <p>Loading shoes...</p>}
	
	  {productsError && (
	    <p className="error-message">{productsError}</p>
	  )}
	
	  {!productsLoading && !productsError && products.length === 0 && (
	    <p>No shoes are currently available.</p>
	  )}
	
	  {!productsLoading && !productsError && products.length > 0 && (
	    <div className="grid">
	      {products.map((product) => (
	        <ProductCard
	          key={product.id}
	          product={product}
	          onAdd={addToCart}
	        />
	      ))}
	    </div>
	  )}
	 </section>

        {cart.length > 0 && (
          <section className="cart-section">
            <div className="cart-header">
              <div>
                <p className="eyebrow">YOUR CART</p>
                <h2>Ready to checkout?</h2>
              </div>

              <button onClick={() => setCheckoutOpen(true)}>
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
          </section>
        )}

        {checkoutOpen && (
          <section className="checkout-section">
            <div className="checkout-box">
              <div className="checkout-header">
                <div>
                  <p className="eyebrow">CHECKOUT</p>
                  <h2>Complete your order</h2>
                </div>

                <button
                  className="close-button"
                  onClick={() => setCheckoutOpen(false)}
                >
                  Close
                </button>
              </div>

              <Cart
                cart={cart}
                total={cartTotal}
                onUpdate={updateQuantity}
                onRemove={removeFromCart}
              />

              <form className="checkout-form" onSubmit={placeOrder}>
                <input
                  value={customer.name}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      name: e.target.value,
                    })
                  }
                  placeholder="Full name"
                  required
                />

                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      email: e.target.value,
                    })
                  }
                  placeholder="Email address"
                />

                <input
                  value={customer.phone}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      phone: e.target.value,
                    })
                  }
                  placeholder="Phone number"
                  required
                />

                <textarea
                  value={customer.address}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      address: e.target.value,
                    })
                  }
                  placeholder="Delivery address"
                  required
                />

                <button type="submit" disabled={cart.length === 0}>
                  Place order — KSh {cartTotal.toLocaleString()}
                </button>

                <small>{orderStatus}</small>
              </form>
            </div>
          </section>
        )}

        <section id="contact" className="contact">
          <div>
            <p className="eyebrow">CONTACT US</p>
            <h2>Have a question?</h2>
            <p>
              Send us a message and we'll get back to you.
            </p>
          </div>

          <form onSubmit={sendMessage}>
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
            />

            <input
              type="email"
              value={messageForm.email}
              onChange={(e) =>
                setMessageForm({
                  ...messageForm,
                  email: e.target.value,
                })
              }
              placeholder="Email address"
              required
            />

            <textarea
              value={messageForm.message}
              onChange={(e) =>
                setMessageForm({
                  ...messageForm,
                  message: e.target.value,
                })
              }
              placeholder="Your message"
              required
            />

            <button type="submit">Send message</button>

            <small>{messageStatus}</small>
          </form>
        </section>
      </main>

      <footer>© 2026 Asili Kicks</footer>
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
    <article className="card">
      <div className="shoe-placeholder">{product.name}</div>

      <div className="card-body">
        <h3>{product.name}</h3>

        {product.description && <p>{product.description}</p>}

        <p>
          KSh {Number(product.price).toLocaleString()}
        </p>

        {stock > 0 && stock <= 5 && (
          <p className="stock-warning">
            Only {stock} left in stock
          </p>
        )}

        {stock > 5 && (
          <p className="stock-available">
            {stock} available
          </p>
        )}

        {isOutOfStock && (
          <p className="stock-out">
            Out of stock
          </p>
        )}

        <label>
          Size

          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            disabled={isOutOfStock}
          >
            {product.sizes.map((shoeSize) => (
              <option key={shoeSize} value={shoeSize}>
                {shoeSize}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
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
