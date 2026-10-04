import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react'

type Product = {
  id: number
  title: string
  description: string
  category: string
  price: number
  discountPercentage: number
  rating: number
  stock: number
  brand?: string
  thumbnail: string
  images: string[]
}

type Drawer = 'cart' | 'wishlist' | null

type Cart = Record<number, number>

const API_URL = 'https://dummyjson.com/products?limit=100'
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function titleCase(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('featured')
  const [maxPrice, setMaxPrice] = useState(2000)
  const [priceLimit, setPriceLimit] = useState(2000)
  const [drawer, setDrawer] = useState<Drawer>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [view, setView] = useState<'shop' | 'product' | 'checkout'>('shop')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<Cart>(() => readStorage('forma-cart', {}))
  const [wishlist, setWishlist] = useState<number[]>(() => readStorage('forma-wishlist', []))
  const [orderPlaced, setOrderPlaced] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(API_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('The collection could not be loaded.')
        return response.json()
      })
      .then((data: { products: Product[] }) => {
        setProducts(data.products)
        const ceiling = Math.ceil(Math.max(...data.products.map((product) => product.price)))
        setPriceLimit(ceiling)
        setMaxPrice(ceiling)
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') setApiError('We couldn’t reach the collection. Check your connection and try again.')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  useEffect(() => localStorage.setItem('forma-cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('forma-wishlist', JSON.stringify(wishlist)), [wishlist])

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const categories = useMemo(() => [...new Set(products.map((product) => product.category))].sort(), [products])
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matching = products.filter((product) => {
      const matchesSearch = !query || `${product.title} ${product.brand ?? ''} ${product.category} ${product.description}`.toLowerCase().includes(query)
      return matchesSearch && (category === 'all' || product.category === category) && product.price <= maxPrice
    })
    if (sort === 'price-low') matching.sort((a, b) => a.price - b.price)
    if (sort === 'price-high') matching.sort((a, b) => b.price - a.price)
    if (sort === 'rating') matching.sort((a, b) => b.rating - a.rating)
    return matching
  }, [products, search, category, maxPrice, sort])

  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const cartProducts = products.filter((product) => cart[product.id])
  const wishlistProducts = products.filter((product) => wishlist.includes(product.id))
  const subtotal = cartProducts.reduce((sum, product) => sum + product.price * cart[product.id], 0)
  const shipping = subtotal === 0 || subtotal >= 75 ? 0 : 7.5

  function addToCart(productId: number) {
    setCart((current) => ({ ...current, [productId]: (current[productId] ?? 0) + 1 }))
  }

  function changeQuantity(productId: number, change: number) {
    setCart((current) => {
      const quantity = (current[productId] ?? 0) + change
      if (quantity <= 0) {
        const next = { ...current }
        delete next[productId]
        return next
      }
      return { ...current, [productId]: quantity }
    })
  }

  function toggleWishlist(productId: number) {
    setWishlist((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId])
  }

  function openProduct(product: Product) {
    setSelectedProduct(product)
    setView('product')
    setDrawer(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goToShop() {
    setView('shop')
    setSelectedProduct(null)
    setDrawer(null)
    setOrderPlaced(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOrderPlaced(true)
    setCart({})
  }

  function renderFilters() {
    return (
      <>
        <div className="filter-heading"><span>Refine by</span><button type="button" onClick={() => { setCategory('all'); setMaxPrice(priceLimit) }}>Reset</button></div>
        <div className="filter-group">
          <h3>Category</h3>
          <label className="category-option"><input type="radio" name="category" checked={category === 'all'} onChange={() => setCategory('all')} /><span>Everything</span><small>{products.length}</small></label>
          {categories.map((item) => <label className="category-option" key={item}><input type="radio" name="category" checked={category === item} onChange={() => setCategory(item)} /><span>{titleCase(item)}</span><small>{products.filter((product) => product.category === item).length}</small></label>)}
        </div>
        <div className="filter-group price-filter">
          <div className="filter-label-row"><h3>Price range</h3><span>Up to {money(maxPrice)}</span></div>
          <input aria-label="Maximum price" type="range" min="0" max={priceLimit} step="1" value={Math.min(maxPrice, priceLimit)} onChange={(event) => setMaxPrice(Number(event.target.value))} />
          <div className="range-labels"><span>$0</span><span>{money(priceLimit)}</span></div>
        </div>
        <div className="sidebar-note"><Sparkles size={17} /><p>Good things, made to live with.</p></div>
      </>
    )
  }

  function renderProductCard(product: Product) {
    const saved = wishlist.includes(product.id)
    return (
      <article className="product-card" key={product.id}>
        <div className="product-image-wrap">
          <button className="product-image-button" type="button" onClick={() => openProduct(product)} aria-label={`View ${product.title}`}>
            <img src={product.thumbnail} alt={product.title} loading="lazy" />
          </button>
          <span className="product-category-tag">{titleCase(product.category)}</span>
          <button className={`icon-button favorite-button ${saved ? 'is-saved' : ''}`} type="button" onClick={() => toggleWishlist(product.id)} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}>
            <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button className="quick-add" type="button" onClick={() => addToCart(product.id)}><Plus size={15} /> Add</button>
        </div>
        <div className="product-info">
          <div className="product-name-row"><button className="product-name" type="button" onClick={() => openProduct(product)}>{product.title}</button><span className="rating"><Star size={12} fill="currentColor" /> {product.rating.toFixed(1)}</span></div>
          <div className="product-meta"><span>{product.brand ?? titleCase(product.category)}</span><strong>{money(product.price)}</strong></div>
        </div>
      </article>
    )
  }

  return (
    <div className="app-shell">
      <div className="announcement"><span>Considered things for everyday living</span><span className="announcement-right">Free shipping on orders over $75 <ArrowRight size={13} /></span></div>
      <header className="site-header">
        <div className="header-inner">
          <button type="button" className="wordmark" onClick={goToShop}>forma<span>®</span></button>
          <nav className="main-nav" aria-label="Main navigation"><button type="button" className={view === 'shop' ? 'nav-active' : ''} onClick={goToShop}>Shop all</button><button type="button" onClick={() => { setCategory('beauty'); setView('shop'); setSelectedProduct(null) }}>Beauty</button><button type="button" onClick={() => { setCategory('furniture'); setView('shop'); setSelectedProduct(null) }}>Home</button><button type="button" onClick={() => { setCategory('womens-dresses'); setView('shop'); setSelectedProduct(null) }}>Wear</button></nav>
          <div className="header-actions"><label className="header-search"><Search size={17} /><input ref={searchInputRef} aria-label="Search products" placeholder="Search the collection" value={search} onChange={(event) => { setSearch(event.target.value); if (view !== 'shop') goToShop() }} /><kbd>⌘ K</kbd></label><button type="button" className="header-icon" onClick={() => setDrawer('wishlist')} aria-label={`Wishlist, ${wishlist.length} items`}><Heart size={19} /><span className="count-dot">{wishlist.length}</span></button><button type="button" className="header-icon bag-icon" onClick={() => setDrawer('cart')} aria-label={`Shopping bag, ${cartCount} items`}><ShoppingBag size={19} /><span className="count-dot">{cartCount}</span></button></div>
        </div>
      </header>

      {view === 'shop' && <main>
        <section className="hero-band">
          <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> The everyday edit · Vol. 04</div><h1>Make room for<br /><em>good things.</em></h1><p>Useful, beautiful, and better by design. Find the pieces you’ll reach for every day.</p><button className="hero-cta" type="button" onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}>Explore the collection <ArrowRight size={16} /></button><div className="hero-index"><span>01</span><span className="index-rule" /><span>Objects, thoughtfully chosen</span></div></div>
          <div className="hero-art" aria-label="Editorial product still life"><img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1200&q=85" alt="Sculptural ceramic vessels on a warm studio shelf" /><div className="art-caption"><span>Form follows feeling</span><span>Est. for everyday</span></div><div className="art-stamp">MADE<br />TO KEEP</div></div>
          <div className="hero-side-note">A LITTLE LESS, A LOT MORE <span>↘</span></div>
        </section>
        <section className="collection-section" id="collection">
          <div className="collection-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> The collection</div><h2>Objects with <em>intention.</em></h2></div><p>Considered essentials for your rituals, your rooms, your real life.</p></div>
          <div className="catalog-layout">
            <aside className="filter-sidebar">{renderFilters()}</aside>
            <div className="catalog-main">
              <div className="catalog-toolbar"><div className="results-count">{loading ? 'Finding your things…' : <><strong>{filteredProducts.length}</strong> pieces to discover</>}</div><div className="toolbar-controls"><button type="button" className="mobile-filter-button" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} /> Filters</button><label className="sort-select"><span>Sort:</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Top rated</option></select><ChevronDown size={14} /></label></div></div>
              {apiError && <div className="error-state"><p>{apiError}</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>}
              {loading ? <div className="product-grid">{Array.from({ length: 8 }, (_, index) => <div className="skeleton-card" key={index}><div className="skeleton-image" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div> : filteredProducts.length ? <div className="product-grid">{filteredProducts.map(renderProductCard)}</div> : <div className="empty-results"><Search size={26} /><h3>No pieces found</h3><p>Try another search or clear the filters.</p><button type="button" onClick={() => { setSearch(''); setCategory('all'); setMaxPrice(priceLimit) }}>Clear filters</button></div>}
            </div>
          </div>
        </section>
        <section className="manifesto"><span className="manifesto-mark">f.</span><div><div className="eyebrow">A note on choosing well</div><p>“The best things are the ones that quietly become part of your life.”</p></div><span className="manifesto-sign">The Forma edit</span></section>
      </main>}

      {view === 'product' && selectedProduct && <main className="detail-page"><button className="back-link" type="button" onClick={goToShop}><ArrowLeft size={16} /> Back to the collection</button><div className="detail-layout"><div className="detail-image"><img src={selectedProduct.images?.[0] ?? selectedProduct.thumbnail} alt={selectedProduct.title} /></div><div className="detail-copy"><div className="eyebrow"><span className="eyebrow-line" /> {titleCase(selectedProduct.category)}</div><h1>{selectedProduct.title}</h1><div className="detail-rating"><span><Star size={15} fill="currentColor" /> {selectedProduct.rating.toFixed(1)}</span><span>{selectedProduct.brand ?? 'Selected by Forma'}</span></div><p className="detail-price">{money(selectedProduct.price)}</p><p className="detail-description">{selectedProduct.description}</p><div className="stock-note"><span className={selectedProduct.stock < 10 ? 'stock-low' : ''} /> {selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : 'Currently unavailable'}</div><div className="detail-actions"><button type="button" className="primary-button" onClick={() => addToCart(selectedProduct.id)} disabled={!selectedProduct.stock}>Add to bag <ShoppingBag size={17} /></button><button type="button" className={`detail-wishlist ${wishlist.includes(selectedProduct.id) ? 'is-saved' : ''}`} onClick={() => toggleWishlist(selectedProduct.id)} aria-label="Toggle wishlist"><Heart size={19} fill={wishlist.includes(selectedProduct.id) ? 'currentColor' : 'none'} /></button></div><div className="detail-perks"><span><Check size={15} /> Thoughtfully selected</span><span><Check size={15} /> Easy 30-day returns</span><span><Check size={15} /> Free shipping over $75</span></div></div></div></main>}

      {view === 'checkout' && <main className="checkout-page"><button className="back-link" type="button" onClick={() => setView('shop')}><ArrowLeft size={16} /> Continue shopping</button>{orderPlaced ? <div className="order-success"><div className="success-mark"><Check size={30} /></div><div className="eyebrow">Order confirmed</div><h1>Good things<br /><em>are on their way.</em></h1><p>Thank you for choosing Forma. Your order is being prepared with care.</p><button type="button" className="primary-button" onClick={goToShop}>Back to the collection <ArrowRight size={16} /></button></div> : <><div className="checkout-heading"><div className="eyebrow"><span className="eyebrow-line" /> Just a few details</div><h1>Make it <em>yours.</em></h1></div><div className="checkout-layout"><form className="checkout-form" onSubmit={placeOrder}><section className="form-section"><div className="form-section-heading"><span>01</span><h2>Contact</h2></div><label>Email address<input type="email" placeholder="you@example.com" required /></label></section><section className="form-section"><div className="form-section-heading"><span>02</span><h2>Delivery</h2></div><div className="form-grid"><label>First name<input autoComplete="given-name" required /></label><label>Last name<input autoComplete="family-name" required /></label></div><label>Street address<input autoComplete="street-address" required /></label><div className="form-grid"><label>City<input autoComplete="address-level2" required /></label><label>ZIP code<input autoComplete="postal-code" required /></label></div><label>Country<select defaultValue="United States"><option>United States</option><option>Canada</option><option>United Kingdom</option><option>Australia</option></select></label></section><section className="form-section"><div className="form-section-heading"><span>03</span><h2>Payment</h2></div><label>Name on card<input autoComplete="cc-name" required /></label><label>Card number<input inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" minLength={12} required /></label><div className="form-grid"><label>Expiry date<input placeholder="MM / YY" autoComplete="cc-exp" required /></label><label>Security code<input inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" required /></label></div><p className="demo-payment-note">Secure demo checkout. No payment will be processed.</p></section><button type="submit" className="primary-button place-order-button">Place order · {money(subtotal + shipping)} <ArrowRight size={17} /></button></form><aside className="order-summary"><h2>Your bag <span>({cartCount})</span></h2>{cartProducts.map((product) => <div className="summary-item" key={product.id}><img src={product.thumbnail} alt="" /><div><strong>{product.title}</strong><span>Qty {cart[product.id]}</span></div><b>{money(product.price * cart[product.id])}</b></div>)}<div className="summary-totals"><div><span>Subtotal</span><span>{money(subtotal)}</span></div><div><span>Shipping</span><span>{shipping === 0 ? 'Complimentary' : money(shipping)}</span></div><div className="summary-total"><strong>Total</strong><strong>{money(subtotal + shipping)}</strong></div></div></aside></div></>}</main>}

      <footer className="site-footer"><button className="wordmark footer-mark" type="button" onClick={goToShop}>forma<span>®</span></button><span>Objects for everyday. Chosen with intention.</span><span>© 2025 Forma Supply Co.</span></footer>

      {filtersOpen && <div className="drawer-backdrop filter-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false) }}><aside className="filter-drawer"><div className="drawer-header"><h2>Filters</h2><button type="button" className="icon-button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={20} /></button></div>{renderFilters()}<button type="button" className="primary-button apply-filters" onClick={() => setFiltersOpen(false)}>Show {filteredProducts.length} pieces <ArrowRight size={16} /></button></aside></div>}

      {drawer && <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDrawer(null) }}><aside className="side-drawer"><div className="drawer-header"><div><div className="eyebrow">Your Forma</div><h2>{drawer === 'cart' ? `Shopping bag (${cartCount})` : `Saved things (${wishlist.length})`}</h2></div><button type="button" className="icon-button" onClick={() => setDrawer(null)} aria-label="Close drawer"><X size={20} /></button></div>{drawer === 'cart' ? cartProducts.length ? <><div className="drawer-items">{cartProducts.map((product) => <div className="drawer-item" key={product.id}><button type="button" className="drawer-item-image" onClick={() => openProduct(product)}><img src={product.thumbnail} alt={product.title} /></button><div className="drawer-item-info"><button type="button" className="drawer-item-name" onClick={() => openProduct(product)}>{product.title}</button><span>{money(product.price)}</span><div className="quantity-control"><button type="button" onClick={() => changeQuantity(product.id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button><span>{cart[product.id]}</span><button type="button" onClick={() => changeQuantity(product.id, 1)} aria-label="Increase quantity"><Plus size={13} /></button></div></div><button type="button" className="remove-item" onClick={() => changeQuantity(product.id, -cart[product.id])} aria-label={`Remove ${product.title}`}><X size={16} /></button></div>)}</div><div className="drawer-bottom"><div className="shipping-progress">{subtotal >= 75 ? 'You unlocked complimentary shipping.' : `You’re ${money(75 - subtotal)} away from complimentary shipping.`}<div><span style={{ width: `${Math.min((subtotal / 75) * 100, 100)}%` }} /></div></div><div className="drawer-subtotal"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><span className="tax-note">Shipping and taxes calculated at checkout.</span><button type="button" className="primary-button checkout-button" onClick={() => { setDrawer(null); setView('checkout'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Continue to checkout <ArrowRight size={16} /></button></div></> : <div className="drawer-empty"><ShoppingBag size={28} /><h3>Your bag is taking a breather.</h3><p>Find something that feels like you.</p><button type="button" onClick={() => { setDrawer(null); goToShop() }}>Explore the collection <ArrowRight size={15} /></button></div> : wishlistProducts.length ? <><div className="drawer-items">{wishlistProducts.map((product) => <div className="drawer-item" key={product.id}><button type="button" className="drawer-item-image" onClick={() => openProduct(product)}><img src={product.thumbnail} alt={product.title} /></button><div className="drawer-item-info"><button type="button" className="drawer-item-name" onClick={() => openProduct(product)}>{product.title}</button><span>{money(product.price)}</span><button type="button" className="move-to-bag" onClick={() => { addToCart(product.id); toggleWishlist(product.id) }}>Move to bag <ArrowRight size={13} /></button></div><button type="button" className="remove-item" onClick={() => toggleWishlist(product.id)} aria-label={`Remove ${product.title} from wishlist`}><X size={16} /></button></div>)}</div><button type="button" className="primary-button checkout-button wishlist-continue" onClick={() => { setDrawer(null); goToShop() }}>Keep looking <ArrowRight size={16} /></button></> : <div className="drawer-empty"><Heart size={28} /><h3>Nothing saved just yet.</h3><p>Keep the pieces you love close by.</p><button type="button" onClick={() => { setDrawer(null); goToShop() }}>Explore the collection <ArrowRight size={15} /></button></div>}</aside></div>}
    </div>
  )
}

export default App
