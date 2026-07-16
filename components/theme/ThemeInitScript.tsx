import Script from "next/script";

import { THEME_INIT_SCRIPT } from "@/lib/theme";

export default function ThemeInitScript() {
    return (
        <Script id="theme-init" strategy="beforeInteractive">
            {THEME_INIT_SCRIPT}
        </Script>
    );
}