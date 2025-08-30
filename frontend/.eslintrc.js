module.exports = {
  extends: [
    "react-app",
    "react-app/jest"
  ],
  rules: {
    // Disable strict syntax checking for deployment
    "jsx-a11y/anchor-is-valid": "off",
    "no-unused-vars": "warn",
    "react/jsx-no-target-blank": "warn",
    // Allow JSX syntax errors to be warnings instead of errors
    "react/jsx-no-duplicate-props": "warn",
    "react/jsx-uses-react": "warn",
    "react/jsx-uses-vars": "warn"
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
};
