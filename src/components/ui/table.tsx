import React from "react";

export function Table({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={`w-full caption-bottom text-sm ${className || ""}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <thead className={`border-b ${className || ""}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <tbody className={`divide-y ${className || ""}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <tr
      className={`border-b transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-100 ${
        className || ""
      }`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <th
      className={`h-12 px-4 text-left align-middle font-medium text-gray-500 ${
        className || ""
      }`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <td className={`p-4 align-middle ${className || ""}`} {...props}>
      {children}
    </td>
  );
}
