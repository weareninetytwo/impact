"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MODULE_NAV, PRODUCT_TAGLINE } from "@impact/shared";
import styles from "./app-shell.module.css";

interface MobileShellProps {
  tenantName: string;
  userLabel: string;
  authLabel: string;
  children: React.ReactNode;
}

export function MobileShell({
  tenantName,
  userLabel,
  authLabel,
  children,
}: MobileShellProps) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${navOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.brand}>
          <Link href="/dashboard" className={styles.logo} onClick={() => setNavOpen(false)}>
            Impact
          </Link>
          <p className={styles.tenant}>{tenantName}</p>
        </div>
        <nav className={styles.nav} aria-label="Main navigation">
          {MODULE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${pathname.startsWith(item.href) ? styles.navLinkActive : ""}`}
              onClick={() => setNavOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className={styles.tagline}>{PRODUCT_TAGLINE}</p>
      </aside>

      {navOpen && (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}

      <div className={styles.main}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Open navigation"
            onClick={() => setNavOpen(true)}
          >
            ☰
          </button>
          <div className={styles.headerMeta}>
            <span className={styles.authBadge}>{authLabel}</span>
            <span className={styles.user}>{userLabel}</span>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
