import { useMemo, useState } from "react";

function RatesCalculator() {
  const [formData, setFormData] = useState({
    weight: "",
    itemCostUSD: "",
    exchangeRate: "158",
    dutyRate: "20",
    gctRate: "15",
    otherFeesJMD: "",
  });

  const ROYAL_BLUE = "#0B3D91";
  const GOLD = "#D4AF37";
  const WHITE = "#ffffff";
  const LIGHT_BG = "#f4f7fb";
  const BORDER = "#dbe3ef";
  const MUTED = "#64748b";
  const TEXT = "#0f172a";

  const shippingRates = {
    1: 800, 2: 1100, 3: 1500, 4: 1800, 5: 2200,
    6: 2600, 7: 2900, 8: 3300, 9: 3700, 10: 4200,
    11: 4500, 12: 4800, 13: 5100, 14: 5400, 15: 5700,
    16: 6000, 17: 6300, 18: 6600, 19: 6900, 20: 7200,
    21: 7350, 22: 7450, 23: 7600, 24: 7750, 25: 7900,
    26: 8150, 27: 8300, 28: 8450, 29: 8600, 30: 8800,
    31: 11500, 32: 12000, 33: 12500, 34: 13000, 35: 13500,
    36: 14000, 37: 14500, 38: 15000, 39: 15500, 40: 16000,
    41: 16300, 42: 16500, 43: 16800, 44: 17200, 45: 17500,
    46: 17800, 47: 18400, 48: 18800, 49: 19200, 50: 19600,
    51: 20000, 52: 20400, 53: 20800, 54: 21200, 55: 21600,
    56: 22000, 57: 22400, 58: 22800, 59: 23200, 60: 23600,
    61: 23850, 62: 24200, 63: 24600, 64: 24900, 65: 25300,
    66: 25600, 67: 25900, 68: 26300, 69: 26700, 70: 27200,
    71: 27600, 72: 27900, 73: 28400, 74: 28800, 75: 29200,
    76: 29600, 77: 29900, 78: 30200, 79: 30600, 80: 30900,
    81: 31300, 82: 31600, 83: 32000, 84: 32600, 85: 33000,
    86: 33400, 87: 33800, 88: 34200, 89: 34600, 90: 35000,
    91: 35300, 92: 35700, 93: 36000, 94: 36400, 95: 36800,
    96: 37200, 97: 37600, 98: 38000, 99: 38400, 100: 38800,
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const result = useMemo(() => {
    const weight = Number(formData.weight || 0);
    const billedWeight = weight > 0 ? Math.ceil(weight) : 0;

    const shippingCharge =
      billedWeight > 0 && billedWeight <= 100 ? shippingRates[billedWeight] || 0 : 0;

    const itemCostUSD = Number(formData.itemCostUSD || 0);
    const exchangeRate = Number(formData.exchangeRate || 0);
    const dutyRate = Number(formData.dutyRate || 0);
    const gctRate = Number(formData.gctRate || 0);
    const otherFeesJMD = Number(formData.otherFeesJMD || 0);

    const itemCostJMD = itemCostUSD * exchangeRate;
    const estimatedDuty = itemCostJMD * (dutyRate / 100);
    const estimatedGCT = (itemCostJMD + estimatedDuty) * (gctRate / 100);
    const estimatedCustoms = estimatedDuty + estimatedGCT + otherFeesJMD;
    const estimatedTotal = shippingCharge + estimatedCustoms;

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
    };
  }, [formData]);

  const money = (value) =>
    `JMD ${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const inputStyle = {
    padding: "12px",
    borderRadius: "10px",
    border: `1px solid ${BORDER}`,
    width: "100%",
    boxSizing: "border-box",
  };

  const cardStyle = {
    backgroundColor: WHITE,
    borderRadius: "16px",
    padding: "20px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
  };

  return (
    <div style={{ backgroundColor: LIGHT_BG }}>
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ margin: 0, color: TEXT, fontSize: "36px" }}>
          Rates Calculator
        </h1>
        <p style={{ margin: "6px 0 0 0", color: MUTED }}>
          Estimate your Eltham Konnect shipping charge and possible Jamaica Customs charges.
        </p>
      </div>

      <div
        style={{
          ...cardStyle,
          marginBottom: "22px",
          background: `linear-gradient(135deg, ${ROYAL_BLUE}, #1f4fb0)`,
          color: WHITE,
          border: "none",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Important Notice</h2>
        <p style={{ lineHeight: 1.6, marginBottom: 0 }}>
          This calculator gives an estimate only. Final customs charges may vary based on item type,
          declared value, customs assessment, exchange rate, and other applicable fees.
        </p>
      </div>

      <div className="rates-grid">
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Eltham Konnect Shipping Calculator</h2>

          <label style={{ fontWeight: "bold", color: TEXT }}>Package Weight / lb</label>
          <input
            type="number"
            step="0.1"
            name="weight"
            placeholder="Example: 2.5"
            value={formData.weight}
            onChange={handleChange}
            style={{ ...inputStyle, marginTop: "8px", marginBottom: "16px" }}
          />

          {result.overLimit ? (
            <div
              style={{
                backgroundColor: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: "12px",
                padding: "14px",
                color: "#9a3412",
                fontWeight: "bold",
              }}
            >
              Rates are currently available up to 100 lb. Please contact Eltham Konnect for this weight.
            </div>
          ) : null}

          <div
            style={{
              backgroundColor: "#eef4ff",
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              padding: "14px",
              marginTop: "10px",
            }}
          >
            <div style={{ color: MUTED, fontSize: "13px" }}>Billed Weight</div>
            <div style={{ fontSize: "26px", fontWeight: "800", color: ROYAL_BLUE }}>
              {result.billedWeight || 0} lb
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#fffbeb",
              border: `1px solid ${BORDER}`,
              borderRadius: "12px",
              padding: "14px",
              marginTop: "12px",
            }}
          >
            <div style={{ color: MUTED, fontSize: "13px" }}>Estimated Shipping Charge</div>
            <div style={{ fontSize: "26px", fontWeight: "800", color: GOLD }}>
              {money(result.shippingCharge)}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>
            Jamaica Customs Estimate
          </h2>

          <div className="form-grid">
            <div>
              <label style={{ fontWeight: "bold", color: TEXT }}>Item Cost / USD</label>
              <input
                type="number"
                name="itemCostUSD"
                placeholder="Example: 100"
                value={formData.itemCostUSD}
                onChange={handleChange}
                style={{ ...inputStyle, marginTop: "8px" }}
              />
            </div>

            <div>
              <label style={{ fontWeight: "bold", color: TEXT }}>Exchange Rate</label>
              <input
                type="number"
                name="exchangeRate"
                value={formData.exchangeRate}
                onChange={handleChange}
                style={{ ...inputStyle, marginTop: "8px" }}
              />
            </div>

            <div>
              <label style={{ fontWeight: "bold", color: TEXT }}>Duty Rate %</label>
              <input
                type="number"
                name="dutyRate"
                value={formData.dutyRate}
                onChange={handleChange}
                style={{ ...inputStyle, marginTop: "8px" }}
              />
            </div>

            <div>
              <label style={{ fontWeight: "bold", color: TEXT }}>GCT Rate %</label>
              <input
                type="number"
                name="gctRate"
                value={formData.gctRate}
                onChange={handleChange}
                style={{ ...inputStyle, marginTop: "8px" }}
              />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontWeight: "bold", color: TEXT }}>
                Other Fees / JMD
              </label>
              <input
                type="number"
                name="otherFeesJMD"
                placeholder="Optional"
                value={formData.otherFeesJMD}
                onChange={handleChange}
                style={{ ...inputStyle, marginTop: "8px" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: "22px" }}>
        <h2 style={{ marginTop: 0, color: ROYAL_BLUE }}>Estimated Summary</h2>

        <div className="summary-grid">
          <div><span style={{ color: MUTED }}>Item Value in JMD</span><strong>{money(result.itemCostJMD)}</strong></div>
          <div><span style={{ color: MUTED }}>Estimated Duty</span><strong>{money(result.estimatedDuty)}</strong></div>
          <div><span style={{ color: MUTED }}>Estimated GCT</span><strong>{money(result.estimatedGCT)}</strong></div>
          <div><span style={{ color: MUTED }}>Other Fees</span><strong>{money(result.otherFeesJMD)}</strong></div>
          <div><span style={{ color: MUTED }}>Estimated Customs Total</span><strong>{money(result.estimatedCustoms)}</strong></div>
          <div><span style={{ color: MUTED }}>Shipping Charge</span><strong>{money(result.shippingCharge)}</strong></div>
        </div>

        <div
          style={{
            marginTop: "18px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "14px",
            padding: "18px",
          }}
        >
          <div style={{ color: MUTED, fontSize: "13px", fontWeight: "bold" }}>
            ESTIMATED TOTAL PAYABLE
          </div>
          <div style={{ fontSize: "34px", fontWeight: "900", color: "#16a34a" }}>
            {money(result.estimatedTotal)}
          </div>
        </div>
      </div>

      <style>
        {`
          .rates-grid {
            display: grid;
            grid-template-columns: 1fr 1.3fr;
            gap: 22px;
          }

          .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
          }

          .summary-grid div {
            background: #f8fafc;
            border: 1px solid #dbe3ef;
            border-radius: 12px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .summary-grid strong {
            color: #0f172a;
            font-size: 18px;
          }

          @media (max-width: 900px) {
            .rates-grid,
            .form-grid,
            .summary-grid {
              grid-template-columns: 1fr;
            }

            .form-grid div {
              grid-column: span 1 !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default RatesCalculator;