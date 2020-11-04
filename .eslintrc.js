module.exports = {
  "root": true,
  "env": {
    "node": true,
    "es6": true
  },
  "parser": "babel-eslint",
  "overrides": [
    {
      "files": ["src/client/**/*"],
      "env": {
        "browser": true,
        "es6": true
      },
    },
    {
      "files": ["src/common/**/*"],
      "env": {
        "node": true,
        "browser": true,
        "es6": true
      },
    },
  ],
};
