import vuetify from 'eslint-config-vuetify'
import prettier from 'eslint-config-prettier'

const base = await vuetify({ ts: true })

export default [
  ...base,
  prettier,
  {
    rules: {
      'vue/attributes-order': 'off',
    },
  },
]
