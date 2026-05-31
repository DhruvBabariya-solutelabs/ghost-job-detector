import type { ReactNode } from 'react';

interface IconButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}

export function IconButton({ label, onClick, children, title }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title ?? label}
      className="gjd-focus gjd-iconbtn"
      style={{
        all: 'unset',
        display: 'grid',
        placeItems: 'center',
        width: 32,
        height: 32,
        borderRadius: 'var(--r-pill)',
        color: 'var(--ink-muted)',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </button>
  );
}
