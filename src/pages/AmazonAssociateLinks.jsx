import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Gift,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import api from "../api";

function AmazonAssociateLinks() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [addingItemNumber, setAddingItemNumber] =
    useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeType, setActiveType] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const ROYAL_BLUE = "#0B3D91";
  const ORANGE = "#F15A24";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";
  const CARD_SHADOW =
    "0 10px 24px rgba(15,23,42,0.08)";

  const FILE_BASE =
    "https://eltham-konnect-backend-c2sf.onrender.com";

  const fetchItems = async () => {
    try {
      const res = await api.get(
        "/api/amazon-associate/active"
      );

      setItems(
        Array.isArray(res.data?.data)
          ? res.data.data
          : []
      );
    } catch (error) {
      console.error(
        "Error loading Marketplace items:",
        error
      );

      setItems([]);

      throw error;
    }
  };

      const fetchCart = async () => {
    try {
      const res = await api.get(
        "/api/marketplace-cart"
      );

      setCart(res.data?.data || null);
    } catch (error) {
      console.warn(
        "No existing Marketplace cart was loaded:",
        error?.response?.data?.message ||
          error?.message
      );

      setCart(null);
    }
  };

  const fetchMarketplaceData = async () => {
    setLoading(true);
    setErrorMessage("");

    const results = await Promise.allSettled([
      fetchItems(),
      fetchCart(),
    ]);

    if (
      results[0].status === "rejected" &&
      results[1].status === "rejected"
    ) {
      setErrorMessage(
        "The Marketplace could not be loaded. Please refresh and try again."
      );
    } else if (results[0].status === "rejected") {
      setErrorMessage(
        "Products could not be loaded. Please refresh and try again."
      );
    } else if (results[1].status === "rejected") {
      setErrorMessage(
        "Your cart could not be loaded, but you can continue browsing."
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const addToCart = async (itemNumber) => {
    try {
      setCartLoading(true);
      setAddingItemNumber(itemNumber);

      const res = await api.post(
        "/api/marketplace-cart/add",
        {
          itemNumber,
          quantity: 1,
        }
      );

      setCart(res.data?.data || null);
      alert("Item added to cart.");
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Could not add item to cart."
      );
    } finally {
      setCartLoading(false);
      setAddingItemNumber("");
    }
  };

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return items.filter((item) => {
      const matchesType =
        activeType === "All" ||
        item?.productType === activeType;

      const searchableText = [
        item?.title,
        item?.description,
        item?.category,
        item?.productType,
        item?.itemNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesType &&
        searchableText.includes(normalizedSearch)
      );
    });
  }, [items, activeType, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, activeType, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / pageSize)
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageStart = (page - 1) * pageSize;

  const paginatedItems = filteredItems.slice(
    pageStart,
    pageStart + pageSize
  );

  const firstVisibleItem =
    filteredItems.length === 0 ? 0 : pageStart + 1;

  const lastVisibleItem = Math.min(
    pageStart + pageSize,
    filteredItems.length
  );

  const cartItemCount = useMemo(() => {
    if (!Array.isArray(cart?.items)) {
      return 0;
    }

    return cart.items.reduce(
      (total, item) =>
        total + Number(item?.quantity || 1),
      0
    );
  }, [cart]);

  const productImage = (item) => {
    if (item?.imageUrl) {
      return item.imageUrl;
    }

    if (item?.imageFilePath) {
      return `${FILE_BASE}${item.imageFilePath}`;
    }

    return "";
  };

  const typeOptions = [
    "All",
    "EK Inventory",
    "Amazon Affiliate",
  ];

  const benefitItems = [
    {
      title: "Authentic Products",
      description:
        "Carefully sourced by Eltham Konnect",
      icon: ShieldCheck,
    },
    {
      title: "Fast Jamaica Pickup",
      description:
        "Quick collection from EK locations",
      icon: PackageCheck,
    },
    {
      title: "Delivery Available",
      description:
        "Islandwide delivery options available",
      icon: Truck,
    },
    {
      title: "EK Rewards Eligible",
      description:
        "Earn EK Points on qualifying items",
      icon: Gift,
    },
  ];

  return (
    <div
      className="marketplace-page"
      style={{ backgroundColor: LIGHT_BG }}
    >
      <section className="marketplace-hero">
        <div className="marketplace-hero-circle marketplace-circle-one" />
        <div className="marketplace-hero-circle marketplace-circle-two" />

        <div className="marketplace-hero-content">
          <div className="marketplace-hero-badge">
            <ShoppingCart size={17} />
            EK Marketplace
          </div>

          <h1>
            Shop Trending Products
            <br />
            <span>& EK Exclusive Finds</span>
          </h1>

          <p>
            Explore fragrances, Amazon finds, beauty
            products, gift ideas, and EK-exclusive
            inventory available for pickup or delivery
            in Jamaica.
          </p>

          <div className="marketplace-category-tags">
            {[
              "Body Mists",
              "Lotions",
              "Colognes",
              "Amazon Finds",
              "Gift Ideas",
            ].map((category) => (
              <span key={category}>{category}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="marketplace-benefits">
        {benefitItems.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title}>
              <div className="marketplace-benefit-icon">
                <Icon size={22} />
              </div>

              <div>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            </div>
          );
        })}
      </section>

      {cartItemCount > 0 && (
        <section className="marketplace-cart-summary">
          <div className="marketplace-cart-details">
            <div className="marketplace-cart-icon">
              <ShoppingCart size={24} />
            </div>

            <div>
              <strong>Shopping Cart</strong>
              <span>
                {cartItemCount}{" "}
                {cartItemCount === 1
                  ? "item"
                  : "items"}{" "}
                selected
              </span>
            </div>
          </div>

          <div className="marketplace-cart-actions">
            <div>
              <span>Subtotal</span>
              <strong>
                JMD{" "}
                {Number(
                  cart?.subtotal || 0
                ).toLocaleString()}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/marketplace-cart";
              }}
            >
              <ShoppingCart size={17} />
              View Cart
            </button>
          </div>
        </section>
      )}

      <section className="marketplace-controls">
        <div className="marketplace-controls-heading">
          <div>
            <h2>Browse Products</h2>
            <p>
              Showing {firstVisibleItem} to{" "}
              {lastVisibleItem} of{" "}
              {filteredItems.length} matched products.
            </p>
          </div>

          <button
            type="button"
            className="marketplace-refresh-button"
            onClick={fetchMarketplaceData}
            disabled={loading}
          >
            <RefreshCw size={17} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="marketplace-search-row">
          <div className="marketplace-search-box">
            <Search size={19} />

            <input
              type="search"
              placeholder="Search by product, category, or item number"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <div className="marketplace-type-filters">
            {typeOptions.map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setActiveType(type)}
                aria-pressed={activeType === type}
                className={
                  activeType === type ? "active" : ""
                }
              >
                {type === "All"
                  ? "All Products"
                  : type === "EK Inventory"
                  ? "EK Products"
                  : "Amazon Finds"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="marketplace-error">
          <div>
            <strong>Marketplace notice</strong>
            <span>{errorMessage}</span>
          </div>

          <button
            type="button"
            onClick={fetchMarketplaceData}
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="marketplace-status-card">
          <RefreshCw
            size={25}
            className="marketplace-loading-icon"
          />

          <strong>Loading Marketplace products...</strong>
        </div>
      ) : filteredItems.length > 0 ? (
        <>
          <section className="marketplace-product-grid">
            {paginatedItems.map((item) => {
              const isInventory =
                item.productType === "EK Inventory";

              const isOutOfStock =
                Number(item.quantityInStock || 0) <= 0;

              const isAdding =
                cartLoading &&
                addingItemNumber === item.itemNumber;

              const imageSource = productImage(item);

              return (
                <article
                  key={item.itemNumber}
                  className="marketplace-product-card"
                  style={{
                    backgroundColor: WHITE,
                    border: `1px solid ${BORDER}`,
                    boxShadow: CARD_SHADOW,
                  }}
                >
                  <div
                    className={`marketplace-product-badge ${
                      isInventory
                        ? "inventory"
                        : "amazon"
                    }`}
                  >
                    {isInventory
                      ? "EK PRODUCT"
                      : "AMAZON FIND"}
                  </div>

                  <div className="marketplace-product-image">
                    {imageSource ? (
                      <img
                        src={imageSource}
                        alt={item.title || "Marketplace product"}
                        loading="lazy"
                      />
                    ) : (
                      <div className="marketplace-no-image">
                        <PackageCheck size={35} />
                        <span>No Image Available</span>
                      </div>
                    )}
                  </div>

                  <div className="marketplace-product-body">
                    {item.category && (
                      <div className="marketplace-product-category">
                        {item.category}
                      </div>
                    )}

                    <h2>{item.title}</h2>

                    <p>
                      {item.description ||
                        "View this recommended Marketplace item."}
                    </p>

                    <div className="marketplace-product-footer">
                      {isInventory ? (
                        <>
                          <div className="marketplace-price-row">
                            <div>
                              <span>Price</span>
                              <strong>
                                JMD{" "}
                                {Number(
                                  item.sellingPrice || 0
                                ).toLocaleString()}
                              </strong>
                            </div>

                            <div
                              className={
                                isOutOfStock
                                  ? "marketplace-stock out"
                                  : "marketplace-stock"
                              }
                            >
                              {isOutOfStock
                                ? "Out of stock"
                                : `${item.quantityInStock} in stock`}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="marketplace-cart-button"
                            disabled={
                              isOutOfStock || cartLoading
                            }
                            onClick={() =>
                              addToCart(item.itemNumber)
                            }
                          >
                            <ShoppingCart size={17} />

                            {isAdding
                              ? "Adding..."
                              : isOutOfStock
                              ? "Out of Stock"
                              : "Add to Cart"}
                          </button>
                        </>
                      ) : (
                        <a
                          href={item.affiliateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="marketplace-amazon-button"
                        >
                          {item.buttonText ||
                            "Shop on Amazon"}
                          <ExternalLink size={17} />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="marketplace-pagination">
            <div className="marketplace-page-size">
              <label htmlFor="marketplace-page-size">
                Products:
              </label>

              <select
                id="marketplace-page-size"
                value={pageSize}
                onChange={(event) =>
                  setPageSize(
                    Number(event.target.value)
                  )
                }
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>

            <div className="marketplace-page-status">
              Page {page} of {totalPages}
            </div>

            <div className="marketplace-page-buttons">
              <button
                type="button"
                disabled={page === 1}
                onClick={() =>
                  setPage((currentPage) =>
                    Math.max(1, currentPage - 1)
                  )
                }
              >
                Previous
              </button>

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((currentPage) =>
                    Math.min(
                      totalPages,
                      currentPage + 1
                    )
                  )
                }
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="marketplace-status-card">
          <Search size={28} />
          <strong>No Marketplace products found</strong>
          <span>
            Try another search or select a different
            product type.
          </span>
        </div>
      )}

      <style>
        {`
          .marketplace-page {
            min-height: 100%;
          }

          .marketplace-hero {
            position: relative;
            overflow: hidden;
            margin-bottom: 24px;
            padding: 38px 30px;
            border-radius: 22px;
            background:
              linear-gradient(
                135deg,
                #0B3D91 0%,
                #174ca4 68%,
                #F15A24 100%
              );
            color: #ffffff;
            box-shadow:
              0 12px 30px rgba(15, 23, 42, 0.16);
          }

          .marketplace-hero-circle {
            position: absolute;
            border-radius: 50%;
            background:
              rgba(255, 255, 255, 0.08);
          }

          .marketplace-circle-one {
            top: -55px;
            right: -45px;
            width: 190px;
            height: 190px;
          }

          .marketplace-circle-two {
            bottom: -90px;
            left: -50px;
            width: 230px;
            height: 230px;
          }

          .marketplace-hero-content {
            position: relative;
            z-index: 1;
          }

          .marketplace-hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            margin-bottom: 17px;
            padding: 8px 14px;
            border: 1px solid
              rgba(255, 255, 255, 0.2);
            border-radius: 999px;
            background:
              rgba(255, 255, 255, 0.14);
            font-weight: 800;
          }

                    .marketplace-hero h1 {
            margin: 0 0 14px;
            max-width: 760px;
            color: #ffffff !important;
            font-size: 41px;
            line-height: 1.12;
          }

          .marketplace-hero h1 span {
            color: #ffffff;
          }

          .marketplace-hero p {
            max-width: 730px;
            margin: 0;
            color: rgba(255, 255, 255, 0.92);
            font-size: 16px;
            line-height: 1.7;
          }

          .marketplace-category-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 22px;
          }

          .marketplace-category-tags span {
            padding: 9px 14px;
            border: 1px solid
              rgba(255, 255, 255, 0.2);
            border-radius: 999px;
            background:
              rgba(255, 255, 255, 0.12);
            font-size: 13px;
            font-weight: 800;
          }

          .marketplace-benefits {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 22px;
          }

          .marketplace-benefits > div {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
            padding: 16px;
            border: 1px solid #dbe3ef;
            border-radius: 14px;
            background: #ffffff;
          }

          .marketplace-benefit-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 42px;
            height: 42px;
            flex: 0 0 42px;
            border-radius: 11px;
            background: #eef4ff;
            color: #0B3D91;
          }

          .marketplace-benefits strong,
          .marketplace-benefits span {
            display: block;
          }

          .marketplace-benefits strong {
            color: #0B3D91;
            line-height: 1.3;
          }

          .marketplace-benefits span {
            margin-top: 4px;
            color: #64748b;
            font-size: 13px;
            line-height: 1.4;
          }

          .marketplace-cart-summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 22px;
            padding: 17px;
            border: 1px solid #bfdbfe;
            border-radius: 15px;
            background: #ffffff;
            box-shadow:
              0 8px 20px rgba(15, 23, 42, 0.05);
          }

          .marketplace-cart-details,
          .marketplace-cart-actions {
            display: flex;
            align-items: center;
            gap: 13px;
          }

          .marketplace-cart-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 45px;
            height: 45px;
            border-radius: 12px;
            background: #0B3D91;
            color: #ffffff;
          }

          .marketplace-cart-details strong,
          .marketplace-cart-details span,
          .marketplace-cart-actions span,
          .marketplace-cart-actions strong {
            display: block;
          }

          .marketplace-cart-details strong {
            color: #0B3D91;
            font-size: 17px;
          }

          .marketplace-cart-details span,
          .marketplace-cart-actions span {
            margin-top: 3px;
            color: #64748b;
            font-size: 13px;
          }

          .marketplace-cart-actions > div {
            text-align: right;
          }

          .marketplace-cart-actions strong {
            margin-top: 3px;
            color: #0f172a;
            font-size: 19px;
          }

          .marketplace-cart-actions button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 11px 15px;
            border: 0;
            border-radius: 10px;
            background: #0B3D91;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .marketplace-controls {
            margin-bottom: 20px;
            padding: 18px;
            border: 1px solid #dbe3ef;
            border-radius: 16px;
            background: #ffffff;
          }

          .marketplace-controls-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 15px;
          }

          .marketplace-controls-heading h2 {
            margin: 0;
            color: #0f172a;
          }

          .marketplace-controls-heading p {
            margin: 5px 0 0;
            color: #64748b;
            font-size: 13px;
          }

          .marketplace-refresh-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 10px 14px;
            border: 0;
            border-radius: 9px;
            background: #16a34a;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .marketplace-refresh-button:disabled {
            opacity: 0.65;
            cursor: wait;
          }

          .marketplace-search-row {
            display: grid;
            grid-template-columns:
              minmax(260px, 1fr) auto;
            gap: 14px;
          }

          .marketplace-search-box {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 0 13px;
            border: 1px solid #dbe3ef;
            border-radius: 10px;
            background: #ffffff;
            color: #64748b;
          }

          .marketplace-search-box:focus-within {
            border-color: #0B3D91;
            box-shadow:
              0 0 0 3px rgba(11, 61, 145, 0.1);
          }

          .marketplace-search-box input {
            width: 100%;
            padding: 12px 0;
            border: 0;
            outline: 0;
            background: transparent;
            color: #0f172a;
            font-size: 14px;
          }

          .marketplace-type-filters {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .marketplace-type-filters button {
            padding: 10px 13px;
            border: 1px solid #0B3D91;
            border-radius: 999px;
            background: #ffffff;
            color: #0B3D91;
            font-weight: 800;
            cursor: pointer;
            white-space: nowrap;
          }

          .marketplace-type-filters button.active {
            background: #0B3D91;
            color: #ffffff;
          }

          .marketplace-error {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 20px;
            padding: 14px 16px;
            border: 1px solid #fecaca;
            border-radius: 12px;
            background: #fef2f2;
            color: #991b1b;
          }

          .marketplace-error div {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .marketplace-error button {
            padding: 9px 14px;
            border: 0;
            border-radius: 8px;
            background: #0B3D91;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .marketplace-product-grid {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 18px;
          }

          .marketplace-product-card {
            position: relative;
            display: flex;
            flex-direction: column;
            min-width: 0;
            overflow: hidden;
            border-radius: 16px;
          }

          .marketplace-product-badge {
            position: absolute;
            top: 13px;
            left: 13px;
            z-index: 2;
            padding: 6px 11px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.3px;
          }

          .marketplace-product-badge.inventory {
            background: #16a34a;
            color: #ffffff;
          }

          .marketplace-product-badge.amazon {
            background: #F15A24;
            color: #ffffff;
          }

          .marketplace-product-image {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 260px;
            padding: 13px;
            background: #f8fafc;
          }

          .marketplace-product-image img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .marketplace-no-image {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 8px;
            color: #64748b;
            font-weight: 700;
          }

          .marketplace-product-body {
            display: flex;
            flex: 1;
            flex-direction: column;
            padding: 16px;
          }

          .marketplace-product-category {
            margin-bottom: 7px;
            color: #F15A24;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
          }

          .marketplace-product-body h2 {
            margin: 0 0 8px;
            color: #0f172a;
            font-size: 18px;
            line-height: 1.35;
            overflow-wrap: anywhere;
          }

          .marketplace-product-body p {
            margin: 0 0 15px;
            color: #475569;
            font-size: 14px;
            line-height: 1.55;
          }

          .marketplace-product-footer {
            margin-top: auto;
          }

          .marketplace-price-row {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 11px;
          }

          .marketplace-price-row span,
          .marketplace-price-row strong {
            display: block;
          }

          .marketplace-price-row span {
            color: #64748b;
            font-size: 12px;
          }

          .marketplace-price-row strong {
            margin-top: 3px;
            color: #0B3D91;
            font-size: 19px;
          }

          .marketplace-stock {
            color: #16a34a;
            font-size: 12px;
            font-weight: 800;
            text-align: right;
          }

          .marketplace-stock.out {
            color: #dc2626;
          }

          .marketplace-cart-button,
          .marketplace-amazon-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            min-height: 43px;
            padding: 11px 14px;
            border: 0;
            border-radius: 10px;
            box-sizing: border-box;
            color: #ffffff;
            font-weight: 900;
            text-align: center;
            text-decoration: none;
          }

          .marketplace-cart-button {
            background: #0B3D91;
            cursor: pointer;
          }

          .marketplace-cart-button:disabled {
            background: #94a3b8;
            cursor: not-allowed;
          }

          .marketplace-amazon-button {
            background: #F15A24;
          }

          .marketplace-status-card {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 9px;
            min-height: 180px;
            padding: 24px;
            border: 1px solid #dbe3ef;
            border-radius: 16px;
            background: #ffffff;
            color: #64748b;
            text-align: center;
          }

          .marketplace-status-card strong {
            color: #0f172a;
          }

          .marketplace-loading-icon {
            animation: marketplace-spin 1s linear infinite;
          }

          @keyframes marketplace-spin {
            to {
              transform: rotate(360deg);
            }
          }

          .marketplace-pagination {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 16px;
            margin-top: 20px;
            padding: 14px 0;
            border-top: 1px solid #dbe3ef;
          }

          .marketplace-page-size {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .marketplace-page-size label {
            color: #64748b;
            font-size: 13px;
            font-weight: 800;
          }

          .marketplace-page-size select {
            padding: 9px 28px 9px 10px;
            border: 1px solid #dbe3ef;
            border-radius: 9px;
            background: #ffffff;
          }

          .marketplace-page-status {
            color: #334155;
            font-size: 13px;
            font-weight: 800;
            text-align: center;
          }

          .marketplace-page-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }

          .marketplace-page-buttons button {
            min-width: 82px;
            padding: 9px 13px;
            border: 0;
            border-radius: 9px;
            background: #0B3D91;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
          }

          .marketplace-page-buttons button:disabled {
            background: #e2e8f0;
            color: #64748b;
            cursor: not-allowed;
          }

          @media (max-width: 1050px) {
            .marketplace-benefits {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .marketplace-product-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .marketplace-search-row {
              grid-template-columns: 1fr;
            }

            .marketplace-type-filters {
              overflow-x: auto;
              padding-bottom: 4px;
            }
          }

          @media (max-width: 700px) {
            .marketplace-hero {
              padding: 27px 19px;
              border-radius: 17px;
            }

            .marketplace-hero h1 {
              font-size: 31px;
            }

            .marketplace-hero p {
              font-size: 14px;
            }

            .marketplace-benefits {
              grid-template-columns: 1fr;
            }

            .marketplace-cart-summary,
            .marketplace-cart-actions {
              align-items: stretch;
              flex-direction: column;
            }

            .marketplace-cart-actions,
            .marketplace-cart-actions button {
              width: 100%;
            }

            .marketplace-cart-actions > div {
              text-align: left;
            }

            .marketplace-controls-heading {
              flex-direction: column;
            }

            .marketplace-refresh-button {
              width: 100%;
            }

            .marketplace-type-filters {
              width: 100%;
            }

            .marketplace-product-grid {
              grid-template-columns: 1fr;
            }

            .marketplace-product-image {
              height: 240px;
            }

            .marketplace-pagination {
              grid-template-columns: 1fr;
            }

            .marketplace-page-size,
            .marketplace-page-buttons {
              justify-content: center;
            }

            .marketplace-page-buttons button {
              flex: 1;
            }

            .marketplace-error {
              align-items: stretch;
              flex-direction: column;
            }
          }

          @media (max-width: 420px) {
            .marketplace-hero h1 {
              font-size: 27px;
            }

            .marketplace-category-tags {
              gap: 7px;
            }

            .marketplace-category-tags span {
              padding: 8px 11px;
            }

            .marketplace-product-image {
              height: 220px;
            }

            .marketplace-page-buttons {
              flex-direction: column;
            }
          }
        `}
      </style>
    </div>
  );
}

export default AmazonAssociateLinks;