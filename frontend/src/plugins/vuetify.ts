import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
  theme: {
    defaultTheme: 'mole',
    themes: {
      mole: {
        dark: true,
        colors: {
          background: '#0D0D0D',
          surface: '#1A1A1A',
          surfaceVariant: '#242424',

          primary: '#CC1F1F',
          primaryDark: '#991717',
          primaryLight: '#E84040',

          success: '#4CAF50',
          warning: '#EF9F27',
          error: '#E84040',
          info: '#378ADD',

          onBackground: '#F0EDE8',
          onSurface: '#C8C4BE',
          onPrimary: '#FFFFFF',

          border: '#2E2E2E',
          borderStrong: '#3D3D3D',
        },
      },
    },
  },
  defaults: {
    VCard: {
      border: true,
      rounded: 'lg',
      elevation: 0,
    },
    VBtn: {
      rounded: 'lg',
      elevation: 0,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },
  },
})
