import { Link, type LinkProps } from 'react-router';
import { cn } from '../lib/cn';

export function TextLink({ className, ...props }: LinkProps) {
  return (
    <Link
      className={cn(
        'font-semibold text-indigo-600 hover:text-indigo-500 hover:underline dark:text-indigo-400',
        className,
      )}
      {...props}
    />
  );
}
