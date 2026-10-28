//
// Do not edit directly, this file was auto-generated.
//
// ignore_for_file: constant_identifier_names, non_constant_identifier_names, prefer_const_constructors

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
