const terser = require('@rollup/plugin-terser').default;

module.exports = (config) => {
  // console.log('config', JSON.stringify(config, null, 2));
  return {
    ...config,
    plugins: [...config.plugins, terser()],
  };
};
