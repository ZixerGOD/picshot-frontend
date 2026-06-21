import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // React 19 / react-hooks v7 introdujo esta regla con default 'error'.
      // En la app hay patrones legítimos (reset de modales al cerrar, fetch
      // async, hidratación de localStorage) donde setState dentro de
      // useEffect es la forma correcta. La dejamos como aviso para detectar
      // casos malos en código nuevo sin bloquear el linter.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
