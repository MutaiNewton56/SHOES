import React from 'react';

const API_URL = import.meta.env.VITE_API_URL;

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  image: '',
  sizes: '39, 40, 41, 42, 43, 44',
  stock: '',
};

export default function AdminApp() {
  const [token, setToken] = React.useState(
    () => sessionStorage.getItem('asili_admin_token') || ''
  );

  const [section, setSection] = React.useState('dashboard');
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  const [loginForm, setLoginForm] = React.useState({
    email: '',
    password: '',
  });

  const [productForm, setProductForm] = React.useState(emptyProduct);
  const [editingId, setEditingId] = React.useState(null);
  const [showProductForm, setShowProductForm] = React.useState(false);

  React.useEffect(() => {
    if (token) {
      loadProducts();
    }
  }, [token]);

  async function login(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      sessionStorage.setItem('asili_admin_token', data.token);
      setToken(data.token);

      setLoginForm({
        email: '',
        password: '',
      });
    } catch (err) {
      setError(err.message || 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem('asili_admin_token');
    setToken('');
    setProducts([]);
    setSection('dashboard');
  }

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/admin/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.status === 401) {
        logout();
        throw new Error('Your admin session has expired.');
      }

      if (!res.ok) {
        throw new Error(data.message || 'Could not load products.');
      }

      setProducts(data);
    } catch (err) {
      setError(err.message || 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }

  function startAddProduct() {
    setEditingId(null);
    setProductForm(emptyProduct);
    setShowProductForm(true);
    setMessage('');
    setError('');
  }

  function startEditProduct(product) {
    setEditingId(product.id);

    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      image: product.image || '',
      sizes: (product.sizes || []).join(', '),
      stock: product.stock ?? '',
    });

    setShowProductForm(true);
    setMessage('');
    setError('');
  }

  function cancelProductForm() {
    setShowProductForm(false);
    setEditingId(null);
    setProductForm(emptyProduct);
  }

  async function saveProduct(e) {
    e.preventDefault();

    setLoading(true);
    setError('');
    setMessage('');

    const sizes = productForm.sizes
      .split(',')
      .map((size) => Number(size.trim()))
      .filter((size) => Number.isInteger(size));

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price),
      image: productForm.image,
      sizes,
      stock: Number(productForm.stock),
    };

    try {
      const url = editingId
        ? `${API_URL}/api/admin/products/${editingId}`
        : `${API_URL}/api/admin/products`;

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 401) {
        logout();
        throw new Error('Your admin session has expired.');
      }

      if (!res.ok) {
        throw new Error(data.message || 'Could not save product.');
      }

      setMessage(
        editingId
          ? 'Product updated successfully.'
          : 'Product added successfully.'
      );

      cancelProductForm();
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Could not save product.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(
        `${API_URL}/api/admin/products/${product.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.status === 401) {
        logout();
        throw new Error('Your admin session has expired.');
      }

      if (!res.ok) {
        throw new Error(data.message || 'Could not delete product.');
      }

      setMessage('Product deleted successfully.');
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Could not delete product.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-950 px-5 py-10 text-neutral-950">
        <div className="mx-auto flex min-h-[85vh] max-w-md items-center">
          <div className="w-full rounded-3xl border border-neutral-200 bg-white p-7 shadow-2xl sm:p-9">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">
                Asili Kicks
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight">
                Admin login
              </h1>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Sign in to manage products and your store.
              </p>
            </div>

            <form onSubmit={login} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Email
                </label>

                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({
                      ...loginForm,
                      email: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Password
                </label>

                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({
                      ...loginForm,
                      password: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                  placeholder="Your admin password"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-neutral-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <a
              href="/"
              className="mt-6 block text-center text-sm font-semibold text-neutral-500 hover:text-neutral-950"
            >
              ← Back to store
            </a>
          </div>
        </div>
      </div>
    );
  }

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock),
    0
  );

  const inventoryValue = products.reduce(
    (total, product) =>
      total + Number(product.price) * Number(product.stock),
    0
  );

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-neutral-950">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 lg:px-8">
          <div>
            <p className="text-xl font-black tracking-tight">
              Asili<span className="text-neutral-400">Kicks</span>
            </p>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              Admin dashboard
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="hidden rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 sm:block"
            >
              View store
            </a>

            <button
              onClick={logout}
              className="rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="hidden min-h-[calc(100vh-73px)] w-64 shrink-0 border-r border-neutral-200 bg-white p-5 lg:block">
          <nav className="space-y-2">
            <NavButton
              active={section === 'dashboard'}
              onClick={() => setSection('dashboard')}
            >
              📊 Dashboard
            </NavButton>

            <NavButton
              active={section === 'products'}
              onClick={() => setSection('products')}
            >
              👟 Products
            </NavButton>

            <NavButton
              active={section === 'orders'}
              onClick={() => setSection('orders')}
            >
              📦 Orders
            </NavButton>

            <NavButton
              active={section === 'messages'}
              onClick={() => setSection('messages')}
            >
              💬 Messages
            </NavButton>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-5 sm:p-7 lg:p-10">
          <div className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
            <MobileNav
              active={section === 'dashboard'}
              onClick={() => setSection('dashboard')}
            >
              Dashboard
            </MobileNav>

            <MobileNav
              active={section === 'products'}
              onClick={() => setSection('products')}
            >
              Products
            </MobileNav>

            <MobileNav
              active={section === 'orders'}
              onClick={() => setSection('orders')}
            >
              Orders
            </MobileNav>

            <MobileNav
              active={section === 'messages'}
              onClick={() => setSection('messages')}
            >
              Messages
            </MobileNav>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          {section === 'dashboard' && (
            <Dashboard
              products={products}
              totalStock={totalStock}
              inventoryValue={inventoryValue}
              onProducts={() => setSection('products')}
            />
          )}

          {section === 'products' && (
            <ProductsSection
              products={products}
              loading={loading}
              showProductForm={showProductForm}
              productForm={productForm}
              editingId={editingId}
              onAdd={startAddProduct}
              onEdit={startEditProduct}
              onDelete={deleteProduct}
              onChange={setProductForm}
              onSubmit={saveProduct}
              onCancel={cancelProductForm}
            />
          )}

          {section === 'orders' && (
            <EmptySection
              icon="📦"
              title="Orders"
              text="Order management will appear here next."
            />
          )}

          {section === 'messages' && (
            <EmptySection
              icon="💬"
              title="Messages"
              text="Customer messages will appear here next."
            />
          )}
        </main>
      </div>
    </div>
  );
}

function NavButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
        active
          ? 'bg-neutral-950 text-white'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
      }`}
    >
      {children}
    </button>
  );
}

function MobileNav({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold ${
        active
          ? 'bg-neutral-950 text-white'
          : 'bg-white text-neutral-600 ring-1 ring-neutral-200'
      }`}
    >
      {children}
    </button>
  );
}

function Dashboard({ products, totalStock, inventoryValue, onProducts }) {
  const inStock = products.filter(
    (product) => Number(product.stock) > 0
  ).length;

  const outOfStock = products.filter(
    (product) => Number(product.stock) <= 0
  ).length;

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">
          Overview
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          Store dashboard
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Manage your Asili Kicks inventory and keep your store up to date.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Products"
          value={products.length}
          icon="👟"
        />

        <StatCard
          label="Pairs in stock"
          value={totalStock.toLocaleString()}
          icon="📦"
        />

        <StatCard
          label="In stock"
          value={inStock}
          icon="✓"
        />

        <StatCard
          label="Inventory value"
          value={`KSh ${inventoryValue.toLocaleString()}`}
          icon="KSh"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Inventory
              </p>

              <h2 className="mt-1 text-xl font-black">
                Current products
              </h2>
            </div>

            <button
              onClick={onProducts}
              className="rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800"
            >
              Manage
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {products.slice(0, 5).map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-4"
              >
                <div>
                  <p className="font-bold">{product.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    KSh {Number(product.price).toLocaleString()}
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm">
                  {product.stock} pairs
                </span>
              </div>
            ))}

            {products.length === 0 && (
              <p className="py-8 text-center text-sm text-neutral-500">
                No products yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Attention
          </p>

          <h2 className="mt-1 text-xl font-black">
            Inventory status
          </h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-2xl font-black text-emerald-700">
                {inStock}
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                Products available
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-2xl font-black text-red-700">
                {outOfStock}
              </p>
              <p className="mt-1 text-sm font-semibold text-red-700">
                Out of stock
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Asili
        </span>
      </div>

      <p className="mt-7 text-3xl font-black tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold text-neutral-500">
        {label}
      </p>
    </div>
  );
}

function ProductsSection({
  products,
  loading,
  showProductForm,
  productForm,
  editingId,
  onAdd,
  onEdit,
  onDelete,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">
            Inventory
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Products
          </h1>

          <p className="mt-3 text-neutral-500">
            Add, edit, and manage the shoes available in your store.
          </p>
        </div>

        <button
          onClick={onAdd}
          className="rounded-xl bg-neutral-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-neutral-800"
        >
          + Add product
        </button>
      </div>

      {showProductForm && (
        <form
          onSubmit={onSubmit}
          className="mb-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {editingId ? 'Edit product' : 'New product'}
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {editingId ? 'Update shoe' : 'Add a shoe'}
              </h2>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Product name"
              value={productForm.name}
              onChange={(value) =>
                onChange({ ...productForm, name: value })
              }
              placeholder="Urban Runner"
              required
            />

            <Field
              label="Price (KSh)"
              type="number"
              min="0"
              value={productForm.price}
              onChange={(value) =>
                onChange({ ...productForm, price: value })
              }
              placeholder="4500"
              required
            />

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                Description
              </label>

              <textarea
                value={productForm.description}
                onChange={(e) =>
                  onChange({
                    ...productForm,
                    description: e.target.value,
                  })
                }
                rows="3"
                placeholder="Comfortable everyday sneaker."
                className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 outline-none focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>

            <div className="sm:col-span-2">
              <Field
                label="Image URL"
                value={productForm.image}
                onChange={(value) =>
                  onChange({ ...productForm, image: value })
                }
                placeholder="https://..."
              />

              <p className="mt-2 text-xs text-neutral-400">
                Image uploading will be connected to Supabase Storage next.
              </p>
            </div>

            <Field
              label="Sizes"
              value={productForm.sizes}
              onChange={(value) =>
                onChange({ ...productForm, sizes: value })
              }
              placeholder="39, 40, 41, 42, 43"
              required
            />

            <Field
              label="Stock"
              type="number"
              min="0"
              value={productForm.stock}
              onChange={(value) =>
                onChange({ ...productForm, stock: value })
              }
              placeholder="50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-neutral-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {loading
              ? 'Saving...'
              : editingId
                ? 'Save changes'
                : 'Create product'}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-6 py-5">
          <p className="font-black">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>

        <div className="divide-y divide-neutral-100">
          {products.map((product) => (
            <div
              key={product.id}
              className="p-5 sm:p-6"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">
                      👟
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">
                      {product.name}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        Number(product.stock) > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {Number(product.stock) > 0
                        ? `${product.stock} in stock`
                        : 'Out of stock'}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-neutral-500">
                    KSh {Number(product.price).toLocaleString()}
                  </p>

                  <p className="mt-2 text-xs text-neutral-400">
                    Sizes: {(product.sizes || []).join(', ')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-bold hover:bg-neutral-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => onDelete(product)}
                    className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="text-5xl">👟</div>
              <h3 className="mt-4 text-xl font-black">
                No products yet
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                Add your first product to start building your inventory.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold">
        {label}
      </label>

      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
      />
    </div>
  );
}

function EmptySection({ icon, title, text }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">
        Management
      </p>

      <h1 className="mt-2 text-4xl font-black tracking-tight">
        {title}
      </h1>

      <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
        <div className="text-5xl">{icon}</div>

        <h2 className="mt-5 text-xl font-black">
          {title} management
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
          {text}
        </p>
      </div>
    </div>
  );
}
