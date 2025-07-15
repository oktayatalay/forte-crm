import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

export interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextValue>({});

export const Select = React.forwardRef<HTMLSelectElement, SelectProps & { value?: string; onValueChange?: (value: string) => void; children?: React.ReactNode }>(
  ({ onValueChange, value, children }) => {
    return (
      <SelectContext.Provider value={{ value, onValueChange }}>
        <div className="relative">
          {children}
        </div>
      </SelectContext.Provider>
    );
  }
);
Select.displayName = "Select";

export const SelectTrigger = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { children?: React.ReactNode }>(
  ({ className, children, ...props }, ref) => {
    const { value, onValueChange } = React.useContext(SelectContext);
    return (
      <select
        className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        value={value}
        onChange={(e) => {
          if (onValueChange) onValueChange(e.target.value);
          if (props.onChange) props.onChange(e);
        }}
        {...props}
      >
        {children}
      </select>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent: React.FC<React.PropsWithChildren> = ({ children }) => <>{children}</>;

export const SelectItem: React.FC<React.PropsWithChildren<{ value: string }>> = ({ children, value }) => (
  <option value={value}>{children}</option>
);

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => <>{placeholder}</>;