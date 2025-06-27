import React from 'react';

export const Dialog: React.FC<React.PropsWithChildren<{ open?: boolean; onOpenChange?: (open: boolean) => void }>> = ({ children, open }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 rounded-lg">
        {children}
      </div>
    </div>
  );
};

export const DialogTrigger: React.FC<React.PropsWithChildren<{ asChild?: boolean }>> = ({ children }) => <>{children}</>;
export const DialogContent: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children }) => <>{children}</>;
export const DialogHeader: React.FC<React.PropsWithChildren> = ({ children }) => <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>;
export const DialogTitle: React.FC<React.PropsWithChildren> = ({ children }) => <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>;
export const DialogDescription: React.FC<React.PropsWithChildren> = ({ children }) => <p className="text-sm text-muted-foreground">{children}</p>;