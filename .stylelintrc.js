module.exports = {
  extends: 'stylelint-config-standard',
  plugins: [
    'stylelint-scss',
  ],
  rules: {
    // allow SCSS
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': null,

    // always use 6 characters
    'color-hex-length': null,
    // do repeat monospace
    'font-family-no-duplicate-names': [
      true,
      {
        ignoreFontFamilyNames: ["monospace"],
      },
    ],
    // keep camel case all the way
    'selector-type-case': null,
    // define our own selectors
    'selector-type-no-unknown': null,

  },
};
