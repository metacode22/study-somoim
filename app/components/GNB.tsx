"use client";

import { vars } from "@teamsparta/stack-tokens";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export function GNB() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Don't show GNB on login page
  if (pathname === "/login") {
    return null;
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${vars.line.nonClickable}`,
        padding: "14px 24px",
      }}
    >
      <nav
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Logo + Menu */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "36px",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              textDecoration: "none",
            }}
          >
            <Image src="/images/logo.png" alt="핫소스" width={96} height={24} />
          </Link>

          {/* Menu Items */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Link
              href="/"
              style={{
                backgroundColor: vars.fill.subtle,
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "15px",
                fontWeight: 500,
                color: vars.text.secondary,
                textDecoration: "none",
                lineHeight: "22px",
              }}
            >
              소/스 목록
            </Link>
          </div>
        </div>

        {/* Right: User Info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          {session?.user?.name && (
            <span
              style={{
                padding: "6px 12px",
                fontSize: "15px",
                fontWeight: 500,
                color: vars.text.primary,
                lineHeight: "22px",
              }}
            >
              {session.user.name} 님
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}
