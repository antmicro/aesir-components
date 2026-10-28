import { dartColor, dartFontWeight, dartIdentifier, dartNumber, dartString, lengthToLogicalPixels, parseFontStack } from '@aesir/tokens/internal/flutter';

const HEADER = `//
// Do not edit directly, this file was auto-generated.
//
// ignore_for_file: constant_identifier_names, non_constant_identifier_names, prefer_const_constructors`;

const upperFirst = (word) => word[0].toUpperCase() + word.slice(1);
const enumName = (name) => (name === 'default' ? 'standard' : dartIdentifier([name]));
const variantName = (mode, theme) => (theme === 'default' ? mode : `${mode}${upperFirst(enumName(theme))}`);
const indent = (lines, depth = 1) => lines.map((line) => (line ? `${'  '.repeat(depth)}${line}` : line));

const tokenNode = (root, reference) => {
  const node = reference.split('.').reduce((current, segment) => current?.[segment], root);
  if (!node || !('$value' in node)) throw new Error(`Unresolved token reference: {${reference}}`);
  return node;
};
const resolveValue = (root, value) => {
  const match = typeof value === 'string' ? value.match(/^\{([^}]+)\}$/) : null;
  return match ? resolveValue(root, tokenNode(root, match[1]).$value) : value;
};

const fieldName = (name) => dartIdentifier([name]);

export const emitColors = ({ names, variants, themes, accents, accentFields }) => {
  const fields = names.map(fieldName);
  const accentExpression = (palette) => accentFields.map(([field, token]) => `${fieldName(field)}: ${fieldName(token(palette))}`);

  const lines = [
    HEADER,
    '',
    "import 'package:flutter/material.dart';",
    '',
    '/// Preset colour themes. `standard` is the default Aesir palette.',
    `enum AesirTheme { ${themes.map(enumName).join(', ')} }`,
    '',
    '/// Accent palettes. The chosen palette drives the `accent*` fields.',
    `enum AesirAccent { ${accents.join(', ')} }`,
    '',
    '/// Semantic Aesir colours for one mode and theme. Register on [ThemeData.extensions]',
    '/// and read with [AesirColors.of].',
    '@immutable',
    'class AesirColors extends ThemeExtension<AesirColors> {',
    '  const AesirColors({',
    ...fields.map((field) => `    required this.${field},`),
    '  });',
    '',
    ...fields.map((field) => `  final Color ${field};`),
    ''
  ];

  for (const { theme, mode, values } of variants) {
    lines.push(`  static const AesirColors ${variantName(mode, theme)} = AesirColors(`);
    for (const name of names) lines.push(`    ${fieldName(name)}: ${values.get(name)},`);
    lines.push('  );', '');
  }

  lines.push(
    '  static AesirColors of(BuildContext context) {',
    '    final colors = Theme.of(context).extension<AesirColors>();',
    "    assert(colors != null, 'AesirColors is not registered in ThemeData.extensions.');",
    '    return colors!;',
    '  }',
    '',
    '  /// The preset for [brightness] and [theme] with the [accent] palette applied.',
    '  static AesirColors resolve({',
    '    required Brightness brightness,',
    '    AesirTheme theme = AesirTheme.standard,',
    '    AesirAccent accent = AesirAccent.blue,',
    '  }) {',
    '    final isLight = brightness == Brightness.light;',
    '    final base = switch (theme) {',
    ...themes.map((theme) => `      AesirTheme.${enumName(theme)} => isLight ? ${variantName('light', theme)} : ${variantName('dark', theme)},`),
    '    };',
    '    return base.withAccent(accent);',
    '  }',
    '',
    '  /// Points the `accent*` fields at [choice]. `accentForeground` belongs to the theme and is kept.',
    '  AesirColors withAccent(AesirAccent choice) {',
    '    return switch (choice) {',
    ...accents.flatMap((palette) => [`      AesirAccent.${palette} => copyWith(`, ...accentExpression(palette).map((entry) => `        ${entry},`), '      ),']),
    '    };',
    '  }',
    '',
    '  @override',
    '  AesirColors copyWith({',
    ...fields.map((field) => `    Color? ${field},`),
    '  }) {',
    '    return AesirColors(',
    ...fields.map((field) => `      ${field}: ${field} ?? this.${field},`),
    '    );',
    '  }',
    '',
    '  @override',
    '  AesirColors lerp(ThemeExtension<AesirColors>? other, double t) {',
    '    if (other is! AesirColors) return this;',
    '    return AesirColors(',
    ...fields.map((field) => `      ${field}: Color.lerp(${field}, other.${field}, t)!,`),
    '    );',
    '  }',
    '}',
    ''
  );
  return lines.join('\n');
};

const textStyle = (root, value) => {
  const resolved = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, resolveValue(root, entry)]));
  const fontSize = lengthToLogicalPixels(resolved.fontSize);
  const { primary, fallback } = parseFontStack(resolved.fontFamily);
  const letterSpacing = String(resolved.letterSpacing).trim();
  const em = letterSpacing.match(/^(-?\d*\.?\d+)em$/i);
  const letterSpacingPixels = em ? Number(em[1]) * fontSize : lengthToLogicalPixels(letterSpacing);
  const lineHeight = String(resolved.lineHeight).trim();
  const height = /px$|rem$/i.test(lineHeight) ? lengthToLogicalPixels(lineHeight) / fontSize : Number(lineHeight);
  if (!Number.isFinite(height)) throw new Error(`Unsupported line height: ${resolved.lineHeight}`);
  return [
    `fontFamily: ${dartString(primary)},`,
    ...(fallback.length > 0 ? [`fontFamilyFallback: [${fallback.map(dartString).join(', ')}],`] : []),
    `fontSize: ${dartNumber(fontSize)},`,
    `fontWeight: ${dartFontWeight(resolved.fontWeight)},`,
    `letterSpacing: ${dartNumber(letterSpacingPixels)},`,
    `height: ${dartNumber(height)},`
  ];
};

export const emitTypography = ({ foundations, composites }) => {
  const entries = Object.entries(composites.typography).flatMap(([name, node]) => ('$value' in node ? [[[name], node]] : Object.entries(node).map(([child, token]) => [[name, child], token])));
  const lines = [
    HEADER,
    '',
    "import 'package:flutter/painting.dart';",
    '',
    '/// Composite text styles. Letter spacing is in logical pixels and `height` is a multiple of the font size.',
    'abstract final class AesirTypography {'
  ];
  for (const [path, token] of entries) {
    lines.push(...indent([`static const TextStyle ${dartIdentifier(path)} = TextStyle(`, ...indent(textStyle(foundations, token.$value)), ');']));
  }
  lines.push('}', '');
  return lines.join('\n');
};

export const emitShadows = ({ composites }) => {
  const lines = [HEADER, '', "import 'package:flutter/painting.dart';", '', 'abstract final class AesirShadows {'];
  for (const [name, token] of Object.entries(composites.shadow)) {
    const { color, offsetX, offsetY, blur, spread } = token.$value;
    const dartValue = dartColor(color);
    const transparent = dartValue.startsWith('Color(0x00');
    lines.push(
      ...indent(
        transparent
          ? [`static const List<BoxShadow> ${dartIdentifier([name])} = [];`]
          : [
              `static const List<BoxShadow> ${dartIdentifier([name])} = [`,
              '  BoxShadow(',
              `    color: ${dartValue},`,
              `    offset: Offset(${dartNumber(lengthToLogicalPixels(offsetX))}, ${dartNumber(lengthToLogicalPixels(offsetY))}),`,
              `    blurRadius: ${dartNumber(lengthToLogicalPixels(blur))},`,
              `    spreadRadius: ${dartNumber(lengthToLogicalPixels(spread))},`,
              '  ),',
              '];'
            ]
      )
    );
  }
  lines.push('}', '');
  return lines.join('\n');
};

export const emitMotion = ({ motion }) => {
  const lines = [HEADER, '', "import 'package:flutter/animation.dart';", '', 'abstract final class AesirMotion {'];
  for (const [name, token] of Object.entries(motion.motion.duration)) {
    const milliseconds = String(token.$value).match(/^(\d+(?:\.\d+)?)ms$/);
    if (!milliseconds) throw new Error(`Unsupported duration: ${token.$value}`);
    lines.push(...indent([`static const Duration ${dartIdentifier(['duration', name])} = Duration(milliseconds: ${milliseconds[1]});`]));
  }
  lines.push('');
  for (const [name, token] of Object.entries(motion.motion.easing)) {
    if (!Array.isArray(token.$value) || token.$value.length !== 4) throw new Error(`Unsupported easing: ${name}`);
    lines.push(...indent([`static const Cubic ${dartIdentifier(['easing', name])} = Cubic(${token.$value.map((point) => dartNumber(point)).join(', ')});`]));
  }
  lines.push('}', '');
  return lines.join('\n');
};

export const emitTheme = () =>
  `${HEADER}

import 'package:flutter/material.dart';

import 'aesir_colors.dart';
import 'aesir_palette_light.dart';
import 'aesir_typography.dart';

/// Material [ThemeData] for [brightness], with [AesirColors] registered as a theme extension.
/// Read the full token set in widgets with [AesirColors.of].
ThemeData aesirThemeData({
  required Brightness brightness,
  AesirTheme theme = AesirTheme.standard,
  AesirAccent accent = AesirAccent.blue,
}) {
  final colors = AesirColors.resolve(brightness: brightness, theme: theme, accent: accent);
  final onError = AesirPaletteLight.colorFixedWhite;

  final textTheme = TextTheme(
    headlineLarge: AesirTypography.headingH1,
    headlineMedium: AesirTypography.headingH2,
    headlineSmall: AesirTypography.headingH3,
    titleLarge: AesirTypography.headingH4,
    titleMedium: AesirTypography.headingH5,
    titleSmall: AesirTypography.headingH6,
    bodyLarge: AesirTypography.body,
    bodyMedium: AesirTypography.body,
    bodySmall: AesirTypography.supporting,
    labelLarge: AesirTypography.body,
    labelMedium: AesirTypography.supporting,
    labelSmall: AesirTypography.supporting,
  ).apply(bodyColor: colors.foreground, displayColor: colors.foreground);

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    scaffoldBackgroundColor: colors.background,
    canvasColor: colors.background,
    dividerColor: colors.border,
    colorScheme: ColorScheme(
      brightness: brightness,
      primary: colors.accent,
      onPrimary: colors.accentForeground,
      secondary: colors.accentSurface,
      onSecondary: colors.accentText,
      error: colors.emphasisRed,
      onError: onError,
      surface: colors.surface,
      onSurface: colors.foreground,
      surfaceContainerHighest: colors.backgroundSecondary,
      onSurfaceVariant: colors.foregroundMuted,
      outline: colors.border,
      outlineVariant: colors.border,
      inverseSurface: colors.backgroundInverted,
      onInverseSurface: colors.foregroundInverted,
      inversePrimary: colors.accentSurface,
    ),
    textTheme: textTheme,
    extensions: [colors],
  );
}
`;

export const emitBarrel = (files) => `${HEADER}\n\nlibrary;\n\n${files.map((file) => `export 'src/${file}';`).join('\n')}\n`;

export const emitPubspec = ({ name, version }) => `name: ${name}
description: Aesir design tokens for Flutter, generated from the shared token source.
version: ${version}
publish_to: none

environment:
  sdk: ^3.13.0

dependencies:
  flutter:
    sdk: flutter
`;
