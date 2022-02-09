module.exports = {
  presets: [
    [
      '@babel/preset-env', {
        useBuiltIns: 'usage',
        corejs: 3,
      },
    ] ,
  ],

  plugins: [
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-proposal-export-default-from',

    // // Build error
    //   [
    //     '@babel/plugin-transform-runtime', {
    //       regenerator: true,
    //       // corejs: 3,
    //     },
    //   ],
    ],
}
