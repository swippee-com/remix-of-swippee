import { useCallback } from "react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatBSDate } from "@/lib/bikram-sambat";

/**
 * Returns a locale-aware date formatter.
 * When locale is "ne", dates render in Bikram Sambat with Nepali script.
 * When locale is "en", uses standard date-fns formatting.
 *
 * @param fmtString - date-fns format string (used for EN locale)
 *   Common: "PP" (date), "PPp" (date+time), "MMM d, yyyy", "yyyy-MM-dd"
 */
export function useFormattedDate() {
  const { locale } = useLanguage();

  const formatDate = useCallback(
    (dateInput: string | Date, fmtString: string = "PP"): string => {
      const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

      if (locale === "ne") {
        // Convert to Nepal Time (UTC+5:45) for correct BS date and time
        const nepalOffset = 5 * 60 + 45; // minutes
        const nepalDate = new Date(date.getTime() + (nepalOffset + date.getTimezoneOffset()) * 60000);

        const includesTime = fmtString.includes("p") || fmtString.includes("H") || fmtString.includes("h");
        const bsStr = formatBSDate(nepalDate, "short", true);
        if (includesTime) {
          const hours = String(nepalDate.getHours()).padStart(2, "0");
          const mins = String(nepalDate.getMinutes()).padStart(2, "0");
          const nepaliTime = `${hours}:${mins}`.replace(/[0-9]/g, (d) => "०१२३४५६७८९"[parseInt(d)]);
          return `${bsStr} ${nepaliTime}`;
        }
        return bsStr;
      }

      return format(date, fmtString);
    },
    [locale]
  );

  return { formatDate };
}
