"use client";

import { signOutAction } from "@/lib/auth/actions";
import styles from "./user-menu.module.css";

interface UserMenuProps {
  fullName: string;
  role: string;
  email: string;
}

export function UserMenu({ fullName, role, email }: UserMenuProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.meta}>
        <span className={styles.name}>{fullName}</span>
        <span className={styles.detail}>
          {role.replace(/_/g, " ")} · {email}
        </span>
      </div>
      <form action={signOutAction}>
        <button type="submit" className={styles.signOut}>
          Sign out
        </button>
      </form>
    </div>
  );
}
