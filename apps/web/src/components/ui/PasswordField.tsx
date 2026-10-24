import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { TextField, type TextFieldProps } from './TextField';

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing'>;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <TextField
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="rounded-md p-1.5 text-slate-500 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:text-slate-300"
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      }
      {...props}
    />
  );
}
