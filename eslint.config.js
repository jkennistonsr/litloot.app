import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  ...firebaseRulesPlugin.configs['flat/recommended'],
  {
    ignores: ['dist/**/*', 'node_modules/**/*']
  }
];
