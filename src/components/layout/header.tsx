"use client";
import { Moon, Sun, Monitor, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/context/lang-context";

interface HeaderProps {
  userName: string;
  userRole: string;
  onMenuClick?: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function Header({ userName, userRole, onMenuClick }: HeaderProps) {
  const { setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex items-center rounded-md border overflow-hidden text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLang("uz")}
            className={`px-2.5 py-1.5 transition-colors ${
              lang === "uz"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            UZ
          </button>
          <button
            type="button"
            onClick={() => setLang("ru")}
            className={`px-2.5 py-1.5 transition-colors ${
              lang === "ru"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            RU
          </button>
        </div>

        {/* Theme switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">{t.header.toggleTheme}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" /> {t.header.light}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" /> {t.header.dark}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" /> {t.header.system}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {getInitials(userName)}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{userRole.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
