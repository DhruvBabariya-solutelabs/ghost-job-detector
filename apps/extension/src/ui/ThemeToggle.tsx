/** Theme toggle — sun in dark mode (tap → light), moon in light mode. */

import { IconButton } from './IconButton';
import { SunIcon, MoonIcon } from './icons';
import { useTheme } from './useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <IconButton
      label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggle}
    >
      {theme === 'dark' ? <SunIcon size={17} /> : <MoonIcon size={17} />}
    </IconButton>
  );
}
