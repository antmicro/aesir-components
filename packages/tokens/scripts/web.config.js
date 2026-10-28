import StyleDictionary from 'style-dictionary';
import { registerTokenFormats } from './formats.js';

registerTokenFormats({ StyleDictionary });

export default {
  source: ['src/shared/**/*.json', 'src/light/**/*.json', 'src/semantic/**/*.json'],
  platforms: {
    // Light fragment. @aesir/css combines it with fonts and dark overrides.
    cssLightFragment: {
      transformGroup: 'css',
      buildPath: 'build/token-fragments/',
      files: [
        {
          destination: 'light.css',
          format: 'css/variables',
          options: {
            selector: ':root',
            outputReferences: true
          }
        }
      ]
    },
    docs: {
      transformGroup: 'js',
      buildPath: 'generated/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json/nested',
          options: {
            outputReferences: true
          }
        }
      ]
    }
  }
};
