'use client';

import { useColorScheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightnessOutlined';

type Mode = 'light' | 'dark' | 'system';

const NEXT_MODE: Record<Mode, Mode> = { light: 'dark', dark: 'system', system: 'light' };
const MODE_META = {
  light: { Icon: LightModeIcon, label: 'Light theme' },
  dark: { Icon: DarkModeIcon, label: 'Dark theme' },
  system: { Icon: SettingsBrightnessIcon, label: 'System theme' },
} as const;

/**
 * Cycles light -> dark -> system. MUI persists the choice per browser (FR-8.3).
 * Renders a disabled placeholder until the client resolves the mode, to avoid a
 * hydration mismatch.
 */
export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  if (!mode) {
    return (
      <IconButton aria-label="Change theme" disabled size="small">
        <SettingsBrightnessIcon />
      </IconButton>
    );
  }

  const { Icon, label } = MODE_META[mode];
  return (
    <Tooltip title={`${label} — click to change`}>
      <IconButton
        aria-label={`${label}. Change theme`}
        onClick={() => setMode(NEXT_MODE[mode])}
        size="small"
      >
        <Icon />
      </IconButton>
    </Tooltip>
  );
}
