import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, onValueChange, ...props }, ref) => {
    return (
      <select
        className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        onChange={(e) => {
          if (onValueChange) onValueChange(e.target.value);
          if (props.onChange) props.onChange(e);
        }}
        {...props}
      />
    );
  }
);
Select.displayName = "Select";

export const SelectContent: React.FC<React.PropsWithChildren> = ({ children }) => <>{children}</>;
export const SelectItem: React.FC<React.PropsWithChildren<{ value: string }>> = ({ children, value }) => (
  <option value={value}>{children}</option>
);
export const SelectTrigger = Select;
export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => <>{placeholder}</>;