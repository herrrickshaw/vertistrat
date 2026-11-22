// Shared stub for @tanstack/react-router's <Link>, so components render without a router.
import type { ReactNode } from "react";

type LinkStubProps = {
  to: string;
  hash?: string;
  children?: ReactNode;
  activeProps?: unknown;
  [k: string]: unknown;
};

export function LinkStub({ to, hash, children, activeProps: _a, onClick, ...rest }: LinkStubProps) {
  return (
    <a
      href={hash ? `${to}#${hash}` : to}
      {...rest}
      onClick={(e) => {
        (onClick as ((e: unknown) => void) | undefined)?.(e);
        e.preventDefault(); // jsdom cannot navigate
      }}
    >
      {children}
    </a>
  );
}
