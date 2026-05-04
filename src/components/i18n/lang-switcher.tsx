"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Menu } from "@base-ui/react/menu";
import { Languages } from "lucide-react";

const localeLabels: Record<string, string> = {
  es: "🇪🇸 Español",
  en: "🇺🇸 English",
};

export function LangSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <Menu.Root>
      <Menu.Trigger className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted hover:text-foreground transition-colors">
        <Languages className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8}>
          <Menu.Popup className="min-w-[150px] rounded-md border bg-popover p-1 shadow-md">
            {Object.entries(localeLabels).map(([code, label]) => (
              <Menu.Item
                key={code}
                onClick={() => switchLocale(code)}
                disabled={code === locale}
                className={`flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground disabled:opacity-50 ${code === locale ? "font-semibold" : ""}`}
              >
                {label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
