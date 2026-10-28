import StyleDictionary from 'style-dictionary';
import { registerTokenFormats } from './formats.js';

registerTokenFormats({ StyleDictionary });

export default {
  source: ['src/dark/**/*.json'],
  platforms: {
    // Dark fragment. @aesir/css combines it into the final aesir-global.css.
    cssDarkFragment: {
      transformGroup: 'css',
      buildPath: 'build/token-fragments/',
      files: [
        {
          destination: 'dark.css',
          format: 'css/variables',
          options: {
            selector: '.dark',
            outputReferences: true
          }
        }
      ]
    }
  }
};
