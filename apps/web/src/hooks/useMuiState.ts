import { useTheme, Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

/**
 * Custom hook for convenient access to MUI state and theme properties.
 */
const useMuiState = (): { theme: Theme; isMobile: boolean; isDarkMode: boolean } => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const isDarkMode = theme.palette.mode === 'dark';

    return { theme, isMobile, isDarkMode };
};

export default useMuiState;
