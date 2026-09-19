import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { englishMessages } from "@/test/intl";

/** Wraps `element` in the real English catalog, as the app's locale layout does. */
export function withIntl(element: ReactElement): ReactElement {
  return (
    <NextIntlClientProvider locale="en" timeZone="UTC" messages={englishMessages}>
      {element}
    </NextIntlClientProvider>
  );
}
