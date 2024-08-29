// eslint-disable-next-line no-undef
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
    '@babel/preset-react'
  ],
  plugins: ['@babel/plugin-syntax-import-meta']
};