import { useEffect, useMemo, useState } from "react";

const dateString = (date) => date.toISOString().slice(0, 10);

const shiftDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const nthWeekday = (year, month, weekday, occurrence) => {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return shiftDays(first, offset + (occurrence - 1) * 7);
};

const easterSunday = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(year, month - 1, day));
};

const buildHolidays = (year, country) => {
  const holidays = [];

  const add = (date, name, category = "Public holiday") => {
    if (date.getUTCFullYear() === year) {
      holidays.push({ date: dateString(date), name, category });
    }
  };

  if (country === "JM") {
    const observed = (month, day, name, moveSaturday = false) => {
      const actual = new Date(Date.UTC(year, month - 1, day));
      const weekday = actual.getUTCDay();
      const offset =
        weekday === 0 ? 1 : moveSaturday && weekday === 6 ? 2 : 0;

      add(
        shiftDays(actual, offset),
        offset ? `${name} (observed)` : name
      );
    };

    const easter = easterSunday(year);

    observed(1, 1, "New Year's Day");
    add(shiftDays(easter, -46), "Ash Wednesday");
    add(shiftDays(easter, -2), "Good Friday");
    add(shiftDays(easter, 1), "Easter Monday");
    observed(5, 23, "Labour Day", true);
    observed(8, 1, "Emancipation Day");
    observed(8, 6, "Independence Day");
    add(nthWeekday(year, 10, 1, 3), "National Heroes' Day");

    const christmas = new Date(Date.UTC(year, 11, 25));

    if (christmas.getUTCDay() === 0) {
      add(shiftDays(christmas, 1), "Christmas Day (observed)");
      add(shiftDays(christmas, 2), "Boxing Day (observed)");
    } else {
      add(christmas, "Christmas Day");
      add(shiftDays(christmas, 1), "Boxing Day");
    }

    if (year === 2027) {
      add(
        new Date(Date.UTC(2027, 11, 27)),
        "Eltham Konnect collection closure",
        "Company closure"
      );
    }
  } else {
    // Include adjacent years so observed New Year's Day
    // can correctly appear in the preceding December.
    for (const sourceYear of [year - 1, year, year + 1]) {
      const fixed = (month, day, name) => {
        const actual = new Date(Date.UTC(sourceYear, month - 1, day));
        add(actual, name, "US federal holiday");

        const weekday = actual.getUTCDay();

        if (weekday === 6 || weekday === 0) {
          add(
            shiftDays(actual, weekday === 6 ? -1 : 1),
            `${name} (observed)`,
            "US federal observance"
          );
        }
      };

      fixed(1, 1, "New Year's Day");
      add(
        nthWeekday(sourceYear, 1, 1, 3),
        "Martin Luther King Jr. Day",
        "US federal holiday"
      );
      add(
        nthWeekday(sourceYear, 2, 1, 3),
        "Washington's Birthday",
        "US federal holiday"
      );

      const lastMayDay = new Date(Date.UTC(sourceYear, 5, 0));
      add(
        shiftDays(lastMayDay, -((lastMayDay.getUTCDay() + 6) % 7)),
        "Memorial Day",
        "US federal holiday"
      );

      fixed(6, 19, "Juneteenth");
      fixed(7, 4, "Independence Day");
      add(
        nthWeekday(sourceYear, 9, 1, 1),
        "Labor Day",
        "US federal holiday"
      );
      add(
        nthWeekday(sourceYear, 10, 1, 2),
        "Columbus Day",
        "US federal holiday"
      );
      fixed(11, 11, "Veterans Day");
      add(
        nthWeekday(sourceYear, 11, 4, 4),
        "Thanksgiving Day",
        "US federal holiday"
      );
      fixed(12, 25, "Christmas Day");
    }
  }

  return holidays.sort(
    (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name)
  );
};

const jamaicaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type).value)
    .join("-");
};

export default function CustomerHolidayCalendar() {
  const [today, setToday] = useState(jamaicaToday);
  const currentYear = Number(today.slice(0, 4));
  const [selectedYear, setSelectedYear] = useState("current");
  const [country, setCountry] = useState("JM");

  const year =
    selectedYear === "current" ? currentYear : Number(selectedYear);

  useEffect(() => {
    const refresh = () => setToday(jamaicaToday());
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const holidays = useMemo(
    () => buildHolidays(year, country),
    [year, country]
  );

  const selectStyle = {
    padding: "10px",
    border: "1px solid #dce4ef",
    borderRadius: "8px",
    background: "white",
    color: "#0B3D91",
    width: "100%",
    font: "inherit",
  };

  return (
    <details className="ek-dashboard-details">
      <summary>Jamaica &amp; US Holidays</summary>

      <div className="ek-dashboard-details-body">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <label style={{ flex: "1 1 150px", display: "grid", gap: "5px" }}>
            Country
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              style={selectStyle}
            >
              <option value="JM">Jamaica</option>
              <option value="US">United States</option>
            </select>
          </label>

          <label style={{ flex: "1 1 150px", display: "grid", gap: "5px" }}>
            Year
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              style={selectStyle}
            >
              <option value="current">Current year ({currentYear})</option>
              {[currentYear - 1, currentYear + 1, currentYear + 2].map(
                (value) => (
                  <option key={value} value={String(value)}>
                    {value}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <p style={{ color: "#64748b" }}>
          {country === "US"
            ? "US federal holidays are shown for planning. Warehouse and courier opening hours may differ."
            : "Recurring Jamaican holidays and the approved December 27, 2027 company closure are shown. Special declarations and other closures will be announced separately."}
        </p>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            maxHeight: "360px",
            overflowY: "auto",
          }}
        >
          {holidays.map((holiday) => (
            <li
              key={`${holiday.date}-${holiday.name}`}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #e4e9f1",
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong style={{ color: "#0B3D91" }}>{holiday.name}</strong>
                <div style={{ color: "#64748b", fontSize: "12px" }}>
                  {holiday.category}
                  {holiday.date === today ? " · Today" : ""}
                </div>
              </div>

              <time
                dateTime={holiday.date}
                style={{
                  color: holiday.date === today ? "#b94315" : "#475569",
                }}
              >
                {new Date(`${holiday.date}T00:00:00Z`).toLocaleDateString(
                  "en-JM",
                  {
                    timeZone: "UTC",
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  }
                )}
              </time>
            </li>
          ))}
        </ul>

        <p style={{ marginBottom: 0, fontSize: "12px" }}>
          Sources:{" "}
          <a
            href="https://laws.moj.gov.jm/library/statute/the-holidays-public-general-act"
            target="_blank"
            rel="noreferrer"
          >
            Jamaica holidays legislation
          </a>
          {" · "}
          <a
            href="https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/"
            target="_blank"
            rel="noreferrer"
          >
            US Office of Personnel Management
          </a>
        </p>
      </div>
    </details>
  );
}