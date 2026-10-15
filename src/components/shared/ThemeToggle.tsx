import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { IconButton } from './IconButton';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <IconButton
      icon={dark ? Sun : Moon}
      label={dark ? 'Usar tema claro' : 'Usar tema escuro'}
      onClick={toggleTheme}
      className={className}
    />
  );
}
