import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto border border-line rounded-xl bg-white shadow-sm">
      <table className={`w-full text-start text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead
      className={`bg-stone/50 text-muted text-xs uppercase font-semibold border-b border-line ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
};

export const Tbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tbody className={`divide-y divide-line ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tr
      className={`hover:bg-mist/60 transition-colors ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <th
      className={`px-4 py-3 text-start font-semibold tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <td
      className={`px-4 py-3.5 text-start text-ink align-middle whitespace-nowrap ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};
