import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  CircleDollarSign,
  Info,
  Package,
  RefreshCw,
  Scale,
} from "lucide-react";
import api from "../api";

function RatesCalculator() {
  const [formData, setFormData] = useState({
    weight: "",
    itemCostUSD: "",
    exchangeRate: "158",
    dutyRate: "20",
    gctRate: "15",
    otherFeesJMD: "",
  });

  const [shippingRates, setShippingRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState("");

  const ROYAL_BLUE = "#0B3D91";
  const ORANGE = "#F15A24";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";
  const GREEN = "#16a34a";

  const fetchShippingRates = async () => {
    setRatesLoading(true);
    setRatesError("");

    try {
      const res = await api.get("/api/shipping-rates");

      const rates = Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      const mappedRates = {};

      rates.forEach((rate) => {
        const weight = Number(rate?.weight);
        const price = Number(rate?.price);

        if (
          Number.isFinite(weight) &&
          Number.isFinite(price)
        ) {
          mappedRates[weight] = price;
        }
      });

      setShippingRates(mappedRates);

      if (rates.length === 0) {
        setRatesError(
          "Shipping rates are temporarily unavailable. Please try again shortly."
        );
      }
    } catch (error) {
      console.error("Error loading shipping rates:", error);
      setShippingRates({});
      setRatesError(
        "We could not load the current shipping rates. Please refresh and try again."
      );
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingRates();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (Number(value) < 0) {
      return;
    }

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setFormData({
      weight: "",
      itemCostUSD: "",
      exchangeRate: "158",
      dutyRate: "20",
      gctRate: "15",
      otherFeesJMD: "",
    });
  };

  const result = useMemo(() => {
    const weight = Number(formData.weight || 0);
    const billedWeight =
      weight > 0 ? Math.ceil(weight) : 0;

    const hasShippingRate =
      billedWeight > 0 &&
      Object.prototype.hasOwnProperty.call(
        shippingRates,
        billedWeight
      );

    const shippingCharge = hasShippingRate
      ? Number(shippingRates[billedWeight] || 0)
      : 0;

    const itemCostUSD = Number(
      formData.itemCostUSD || 0
    );

    const exchangeRate = Number(
      formData.exchangeRate || 0
    );

    const dutyRate = Number(
      formData.dutyRate || 0
    );

    const gctRate = Number(
      formData.gctRate || 0
    );

    const otherFeesJMD = Number(
      formData.otherFeesJMD || 0
    );

    const itemCostJMD =
      itemCostUSD * exchangeRate;

    const estimatedDuty =
      itemCostJMD * (dutyRate / 100);

    const estimatedGCT =
      (itemCostJMD + estimatedDuty) *
      (gctRate / 100);

    const estimatedCustoms =
      estimatedDuty +
      estimatedGCT +
      otherFeesJMD;

    const estimatedTotal =
      shippingCharge + estimatedCustoms;

    return {
      billedWeight,
      shippingCharge,
      itemCostJMD,
      estimatedDuty,
      estimatedGCT,
      otherFeesJMD,
      estimatedCustoms,
      estimatedTotal,
      overLimit: billedWeight > 100,
      missingRate:
        billedWeight > 0 &&
        billedWeight <= 100 &&
        !ratesLoading &&
        !hasShippingRate,
    };
  }, [formData, shippingRates, ratesLoading]);

  const money = (value) =>
    `JMD ${Number(value || 0).toLocaleString(
      "en-JM",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

  const inputStyle = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "10px",
    border: `1px solid ${BORDER}`,
    backgroundColor: WHITE,
    color: TEXT,
    fontSize: "15px",
    boxSizing: "border-box",
    outlineColor: ROYAL_BLUE,
  };

  const cardStyle = {
    backgroundColor: WHITE,
    borderRadius: "16px",
    padding: "20px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
  };

  const summaryItems = [
    {
      label: "Item Value in JMD",
      value: result.itemCostJMD,
    },
    {
      label: "Estimated Duty",
      value: result.estimatedDuty,
    },
    {
      label: "Estimated GCT",
      value: result.estimatedGCT,
    },
    {
      label: "Other Fees",
      value: result.otherFeesJMD,
    },
    {
      label: "Estimated Customs Total",
      value: result.estimatedCustoms,
    },
    {
      label: "Shipping Charge",
      value: result.shippingCharge,
    },
  ];

  return (
    <div
      className="rates-calculator-page"
      style={{ backgroundColor: LIGHT_BG }}
    >
      <div className="rates-page-header">
        <div>
          <div className="rates-title-row">
            <Calculator
              size={34}
              color={ROYAL_BLUE}
              strokeWidth={2.2}
            />

            <h1
              style={{
                margin: 0,
                color: TEXT,
                fontSize: "36px",
              }}
            >
              Rates Calculator
            </h1>
          </div>

          <p
            style={{
              margin: "7px 0 0",
              color: MUTED,
              lineHeight: 1.5,
            }}
          >
            Estimate your Eltham Konnect shipping
            charge and possible Jamaica Customs
            charges.
          </p>
        </div>

        <button
          type="button"
          className="rates-reset-button"
          onClick={handleReset}
        >
          <RefreshCw size={17} />
          Reset Calculator
        </button>
      </div>

      <div className="rates-notice">
        <div className="rates-notice-icon">
          <Info size={24} />
        </div>

        <div>
          <h2>Important Notice</h2>

          <p>
            This calculator provides an estimate
            only. Final customs charges may vary
            based on the item type, declared value,
            customs assessment, exchange rate, and
            other applicable fees.
          </p>
        </div>
      </div>

      {ratesError && (
        <div className="rates-error-message">
          <div>
            <strong>Shipping rates unavailable</strong>
            <span>{ratesError}</span>
          </div>

          <button
            type="button"
            onClick={fetchShippingRates}
          >
            Try Again
          </button>
        </div>
      )}

      <div className="rates-grid">
        <section style={cardStyle}>
          <div className="rates-section-heading">
            <Package size={23} color={ROYAL_BLUE} />

            <h2>
              Eltham Konnect Shipping Calculator
            </h2>
          </div>

          <label
            htmlFor="calculator-weight"
            className="rates-label"
          >
            Package Weight (lb)
          </label>

          <input
            id="calculator-weight"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            name="weight"
            placeholder="Example: 2.5"
            value={formData.weight}
            onChange={handleChange}
            style={{
              ...inputStyle,
              marginTop: "8px",
              marginBottom: "16px",
            }}
          />

          {ratesLoading && (
            <div className="rates-status-message">
              Loading current shipping rates...
            </div>
          )}

          {result.overLimit && (
            <div className="rates-warning-message">
              Rates are currently available for
              packages weighing up to 100 lb. Please
              contact Eltham Konnect for assistance
              with this package.
            </div>
          )}

          {result.missingRate && !ratesError && (
            <div className="rates-warning-message">
              A shipping rate was not found for this
              billed weight. Please contact Eltham
              Konnect for assistance.
            </div>
          )}

          <div className="rates-result-card rates-weight-card">
            <div className="rates-result-label">
              <Scale size={17} />
              Billed Weight
            </div>

            <div className="rates-result-value">
              {result.billedWeight || 0} lb
            </div>

            <small>
              Partial pounds are rounded up to the
              next whole pound.
            </small>
          </div>

          <div className="rates-result-card rates-shipping-card">
            <div className="rates-result-label">
              <CircleDollarSign size={17} />
              Estimated Shipping Charge
            </div>

            <div
              className="rates-result-value"
              style={{ color: ORANGE }}
            >
              {ratesLoading
                ? "Loading..."
                : money(result.shippingCharge)}
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <div className="rates-section-heading">
            <CircleDollarSign
              size={23}
              color={ROYAL_BLUE}
            />

            <h2>Jamaica Customs Estimate</h2>
          </div>

          <div className="form-grid">
            <div>
              <label
                htmlFor="calculator-item-cost"
                className="rates-label"
              >
                Item Cost (USD)
              </label>

              <input
                id="calculator-item-cost"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                name="itemCostUSD"
                placeholder="Example: 100"
                value={formData.itemCostUSD}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  marginTop: "8px",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="calculator-exchange-rate"
                className="rates-label"
              >
                Exchange Rate
              </label>

              <input
                id="calculator-exchange-rate"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                name="exchangeRate"
                value={formData.exchangeRate}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  marginTop: "8px",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="calculator-duty-rate"
                className="rates-label"
              >
                Duty Rate (%)
              </label>

              <input
                id="calculator-duty-rate"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                name="dutyRate"
                value={formData.dutyRate}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  marginTop: "8px",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="calculator-gct-rate"
                className="rates-label"
              >
                GCT Rate (%)
              </label>

              <input
                id="calculator-gct-rate"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                name="gctRate"
                value={formData.gctRate}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  marginTop: "8px",
                }}
              />
            </div>

            <div className="rates-other-fees">
              <label
                htmlFor="calculator-other-fees"
                className="rates-label"
              >
                Other Fees (JMD)
              </label>

              <input
                id="calculator-other-fees"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                name="otherFeesJMD"
                placeholder="Optional"
                value={formData.otherFeesJMD}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  marginTop: "8px",
                }}
              />
            </div>
          </div>

          <p className="rates-customs-note">
            Enter the applicable duty and GCT rates
            for your item. Different item categories
            may attract different customs charges.
          </p>
        </section>
      </div>

      <section
        style={{
          ...cardStyle,
          marginTop: "22px",
        }}
      >
        <div className="rates-section-heading">
          <Calculator size={23} color={ROYAL_BLUE} />

          <h2>Estimated Summary</h2>
        </div>

        <div className="summary-grid">
          {summaryItems.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{money(item.value)}</strong>
            </div>
          ))}
        </div>

        <div className="rates-total-card">
          <div>
            <span>ESTIMATED TOTAL PAYABLE</span>

            <small>
              Shipping and estimated customs charges
            </small>
          </div>

          <strong>
            {money(result.estimatedTotal)}
          </strong>
        </div>

        <div className="rates-final-notice">
          This estimate is provided for guidance and
          is not a final invoice or customs
          assessment.
        </div>
      </section>

      <style>
        {`
          .rates-calculator-page {
            min-height: 100%;
          }

          .rates-page-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 22px;
          }

          .rates-title-row {
            display: flex;
            align-items: center;
            gap: 11px;
          }

          .rates-reset-button {
            border: 1px solid #dbe3ef;
            border-radius: 10px;
            padding: 11px 15px;
            background: #ffffff;
            color: #0B3D91;
            font-weight: 800;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            white-space: nowrap;
          }

          .rates-reset-button:hover {
            background: #eef4ff;
          }

          .rates-notice {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            margin-bottom: 22px;
            padding: 20px;
            border-radius: 16px;
            color: #ffffff;
            background: linear-gradient(
              135deg,
              #0B3D91,
              #1f4fb0
            );
            box-shadow: 0 8px 24px
              rgba(11, 61, 145, 0.16);
          }

          .rates-notice-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.14);
          }

          .rates-notice h2 {
            margin: 0 0 7px;
            font-size: 20px;
          }

          .rates-notice p {
            margin: 0;
            line-height: 1.6;
          }

          .rates-error-message {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 14px 16px;
            margin-bottom: 20px;
            border: 1px solid #fecaca;
            border-radius: 12px;
            background: #fef2f2;
            color: #991b1b;
          }

          .rates-error-message div {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .rates-error-message button {
            border: 0;
            border-radius: 8px;
            padding: 9px 14px;
            background: #0B3D91;
            color: #ffffff;
            font-weight: 800;
            cursor: pointer;
            white-space: nowrap;
          }

          .rates-grid {
            display: grid;
            grid-template-columns: 1fr 1.3fr;
            gap: 22px;
          }

          .rates-section-heading {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 18px;
          }

          .rates-section-heading h2 {
            margin: 0;
            color: #0B3D91;
            font-size: 21px;
          }

          .rates-label {
            color: #0f172a;
            font-size: 14px;
            font-weight: 800;
          }

          .rates-status-message {
            padding: 12px;
            margin-bottom: 12px;
            border: 1px solid #bfdbfe;
            border-radius: 10px;
            background: #eff6ff;
            color: #1e40af;
            font-weight: 700;
          }

          .rates-warning-message {
            padding: 13px;
            margin-bottom: 12px;
            border: 1px solid #fed7aa;
            border-radius: 10px;
            background: #fff7ed;
            color: #9a3412;
            font-weight: 700;
            line-height: 1.5;
          }

          .rates-result-card {
            padding: 15px;
            border: 1px solid #dbe3ef;
            border-radius: 12px;
          }

          .rates-weight-card {
            background: #eef4ff;
          }

          .rates-shipping-card {
            margin-top: 12px;
            background: #fff7ed;
            border-color: #fed7aa;
          }

          .rates-result-label {
            display: flex;
            align-items: center;
            gap: 7px;
            color: #64748b;
            font-size: 13px;
            font-weight: 700;
          }

          .rates-result-value {
            margin-top: 5px;
            color: #0B3D91;
            font-size: 27px;
            font-weight: 900;
            overflow-wrap: anywhere;
          }

          .rates-result-card small {
            display: block;
            margin-top: 5px;
            color: #64748b;
            line-height: 1.4;
          }

          .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .rates-other-fees {
            grid-column: span 2;
          }

          .rates-customs-note {
            margin: 18px 0 0;
            padding: 12px 14px;
            border-left: 4px solid #F15A24;
            border-radius: 0 8px 8px 0;
            background: #fff7ed;
            color: #7c2d12;
            font-size: 13px;
            line-height: 1.5;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
          }

          .summary-grid div {
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 0;
            padding: 14px;
            border: 1px solid #dbe3ef;
            border-radius: 12px;
            background: #f8fafc;
          }

          .summary-grid span {
            color: #64748b;
            font-size: 13px;
          }

          .summary-grid strong {
            color: #0f172a;
            font-size: 17px;
            overflow-wrap: anywhere;
          }

          .rates-total-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-top: 18px;
            padding: 20px;
            border-radius: 14px;
            background: #0B3D91;
            color: #ffffff;
          }

          .rates-total-card div {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .rates-total-card span {
            font-size: 13px;
            font-weight: 800;
          }

          .rates-total-card small {
            color: rgba(255, 255, 255, 0.78);
          }

          .rates-total-card > strong {
            color: #ffffff;
            font-size: 30px;
            font-weight: 900;
            text-align: right;
            overflow-wrap: anywhere;
          }

          .rates-final-notice {
            margin-top: 14px;
            color: #64748b;
            font-size: 13px;
            line-height: 1.5;
            text-align: center;
          }

          @media (max-width: 900px) {
            .rates-grid,
            .summary-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .rates-page-header {
              flex-direction: column;
            }

            .rates-title-row {
              align-items: flex-start;
            }

            .rates-title-row h1 {
              font-size: 30px !important;
              line-height: 1.1;
            }

            .rates-reset-button {
              width: 100%;
            }

            .rates-notice {
              padding: 16px;
            }

            .rates-notice-icon {
              width: 38px;
              height: 38px;
            }

            .rates-grid > section {
              padding: 16px !important;
            }

            .form-grid {
              grid-template-columns: 1fr;
            }

            .rates-other-fees {
              grid-column: span 1;
            }

            .rates-error-message {
              align-items: stretch;
              flex-direction: column;
            }

            .rates-error-message button {
              width: 100%;
            }

            .rates-total-card {
              align-items: flex-start;
              flex-direction: column;
              padding: 17px;
            }

            .rates-total-card > strong {
              width: 100%;
              font-size: 27px;
              text-align: left;
            }
          }

          @media (max-width: 420px) {
            .rates-title-row h1 {
              font-size: 27px !important;
            }

            .rates-title-row svg {
              width: 29px;
              height: 29px;
            }

            .rates-section-heading h2 {
              font-size: 19px;
            }

            .rates-result-value {
              font-size: 24px;
            }

            .rates-total-card > strong {
              font-size: 24px;
            }
          }
        `}
      </style>
    </div>
  );
}

export default RatesCalculator;