const plugin = require('tailwindcss/plugin');
const c = require('tailwindcss/colors');

const hexToRgb = hex =>
  hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
    , (m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16))
    .join(' ');

function withOpacityValue(variable) {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) {
      return `rgb(var(${variable}))`;
    }
    return `rgb(var(${variable}) / ${opacityValue})`;
  };
}

function generateColorMap(variable) {
  const obj = {};
  for (let i = 0; i <= 900; i += 50) {
    if (i === 0) continue;
    if (i % 100 !== 0 && i !== 50) continue;
    obj[i] = withOpacityValue(`${variable}-${i}`);
  }
  return obj;
}

module.exports = plugin.withOptions(function(options = {}) {
  return function({ addBase }) {
    const obj = {};
    const dark = {};

    Object.entries(options.colors).forEach(([identifier, value]) => {
      const arr = c[value];
      if (typeof arr === 'undefined') {
        obj[`--color-${identifier}`] = value;
        return;
      }

      Object.entries(arr).forEach(([tier, value]) => {
        obj[`--color-${identifier}-${tier}`] = hexToRgb(value);
      });
    });

    Object.entries(options.darkColors).forEach(([identifier, value]) => {
      const arr = c[value];
      if (typeof arr === 'undefined') {
        if (options?.darkColors?.contrast) {
          const newVal = c[options.darkColors.contrast];
          dark[`--color-${identifier}`] = hexToRgb(newVal[900]);
          return;
        }
        dark[`--color-${identifier}`] = value;
        return;
      }

      const test = Object.entries(arr).map(([_, value]) => {
        return hexToRgb(value);
      }).reverse();

      const values = Object.entries(arr).map(([key, _]) => {
        return `--color-${identifier}-${key}`;
      });

      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        dark[value] = test[i];
      }
    });

    addBase({
      ':root': obj,
      '.dark': {
        '-webkit-font-smoothing': 'antialiased',
        '-moz-osx-font-smoothing': 'grayscale',
        ...dark,
      },
      'body': {
        'background-color': 'rgb(var(--color-bg))',
        'color': `rgb(${options.textColor ?? 'var(--color-contrast-600)'})`,
      },
      'h1, h2, h3, h4, h5, h6': {
        'color': `rgb(${options.headingColor ?? 'var(--color-contrast-900)'})`,
      }
    });
  };
}, (options = {}) => {
  const map = {}
  Object.entries(options.colors).forEach(([identifier, value]) => {
    const arr = c[value];
    if (typeof arr === 'undefined') {
      map[identifier] = withOpacityValue(`--color-${identifier}`);
      return;
    }
    map[identifier] = generateColorMap(`--color-${identifier}`);
  });

  return {
    darkMode: 'class',
    theme: {
      colors: map
    },
  }
});
