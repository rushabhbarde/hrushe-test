"use client";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function daysInMonth(year: number, month: number) {
  return new Date(year || 2000, month, 0).getDate();
}

/**
 * Birth date as Day / Month / Year dropdowns. Native date pickers open on today and hide the
 * year, which makes a birth date slow to reach on phones. Value is "YYYY-MM-DD" or "".
 */
export function BirthDateField({
  value,
  onChange,
  disabled = false,
  selectClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  selectClassName: string;
}) {
  const [year = "", month = "", day = ""] = value ? value.split("-") : [];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 90 }, (_, index) => String(currentYear - 10 - index));
  const maxDay = daysInMonth(Number(year), Number(month) || 1);

  function update(next: { year?: string; month?: string; day?: string }) {
    const y = next.year ?? year;
    const m = next.month ?? month;
    let d = next.day ?? day;
    if (y && m && d && Number(d) > daysInMonth(Number(y), Number(m))) {
      d = String(daysInMonth(Number(y), Number(m))).padStart(2, "0");
    }
    // Partial choices stay visible ("1995--"); the profile form only saves complete dates.
    onChange(y || m || d ? `${y}-${m}-${d}` : "");
  }

  return (
    <div className="grid grid-cols-[1fr_1.3fr_1.4fr] gap-3" role="group" aria-label="Date of birth">
      <select aria-label="Day" value={day} disabled={disabled} onChange={(event) => update({ day: event.target.value })} className={selectClassName}>
        <option value="">Day</option>
        {Array.from({ length: maxDay }, (_, index) => String(index + 1).padStart(2, "0")).map((d) => (
          <option key={d} value={d}>
            {Number(d)}
          </option>
        ))}
      </select>
      <select aria-label="Month" value={month} disabled={disabled} onChange={(event) => update({ month: event.target.value })} className={selectClassName}>
        <option value="">Month</option>
        {MONTHS.map((label, index) => (
          <option key={label} value={String(index + 1).padStart(2, "0")}>
            {label}
          </option>
        ))}
      </select>
      <select aria-label="Year" value={year} disabled={disabled} onChange={(event) => update({ year: event.target.value })} className={selectClassName}>
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
