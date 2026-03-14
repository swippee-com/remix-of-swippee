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
        const includesTime = fmtString.includes("p") || fmtString.includes("H") || fmtString.includes("h");
        const bsStr = formatBSDate(date, "short", true);
        if (includesTime) {
          const time = format(date, "HH:mm");
          const nepaliTime = time.replace(/[0-9]/g, (d) => "०१२३४५६७८९"[parseInt(d)]);
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
