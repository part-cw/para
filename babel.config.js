// required for app and component unit tests

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // handles TS, JSX, modern JS
  };
};