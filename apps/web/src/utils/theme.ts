import { blueGrey, brown, lightGreen } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

export type AppTheme = 'light' | 'dark';

/**
 * Creates a Material-UI theme based on the specified mode.
 * The theme includes custom styles for error states in form components when in dark mode.
 */
export const createAppTheme = (mode: AppTheme) => {
    return createTheme({
        palette: {
            mode,
            ...(mode === 'light' ? { primary: lightGreen, secondary: brown } : { secondary: blueGrey })
        },
        components:
            mode === 'dark'
                ? {
                      MuiFormHelperText: {
                          styleOverrides: {
                              root: {
                                  '&.Mui-error': {
                                      color: 'orange'
                                  }
                              }
                          }
                      },
                      MuiInputLabel: {
                          styleOverrides: {
                              root: {
                                  '&.Mui-error': {
                                      color: 'orange'
                                  }
                              }
                          }
                      },
                      MuiOutlinedInput: {
                          styleOverrides: {
                              notchedOutline: {
                                  // This targets the outline border color for error state
                                  '&.Mui-error': {
                                      borderColor: 'orange'
                                  }
                              },
                              root: {
                                  '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                                      borderColor: 'orange'
                                  }
                              }
                          }
                      },
                      MuiInput: {
                          styleOverrides: {
                              underline: {
                                  '&.Mui-error:after': {
                                      borderBottomColor: 'orange'
                                  }
                              }
                          }
                      }
                  }
                : {}
    });
};
