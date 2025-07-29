module.exports = {
  "src/**/*.{js,jsx,ts,tsx}": [
    "prettier --write",
    "eslint --fix"
  ],
  "src/**/*.{css,md,json}": [
    "prettier --write"
  ]
};
