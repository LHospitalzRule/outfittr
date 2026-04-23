// AppTheme — central design tokens (colors, text styles) matching the React
// frontend's graffiti aesthetic. Used everywhere via AppColors / AppTextStyles.

import 'package:flutter/material.dart';

class AppColors
{
  static const Color bgDark = Color(0xFF120B08);
  static const Color textPrimary = Color(0xFFF3E8D0);
  static const Color textBright = Color(0xFFFFF8EB);
  static const Color accentCoral = Color(0xFFFF5A36);
  static const Color accentAqua = Color(0xFF56F0D4);
  static const Color accentGold = Color(0xFFFFD447);
  static const Color accentPink = Color(0xFFFF2D7A);
  static const Color panelDark = Color(0xDC140C0C);
  static const Color inputBg = Color(0x9E0C0C0E);
  static const Color inputBorder = Color(0x1FFFFFFF);
  static const Color errorText = Color(0xFFFF9F95);
}

class AppTextStyles
{
  // Big bubble-letter title (used for the OUTFITTR / JOIN THE CREW headlines).
  static const TextStyle bubble = TextStyle(
    color: AppColors.textBright,
    fontSize: 48,
    fontWeight: FontWeight.w900,
    letterSpacing: 2,
    height: 1.0,
  );

  static const TextStyle heading = TextStyle(
    color: AppColors.textBright,
    fontSize: 24,
    fontWeight: FontWeight.w800,
    letterSpacing: 1,
  );

  static const TextStyle body = TextStyle(
    color: AppColors.textPrimary,
    fontSize: 14,
    height: 1.4,
  );

  // Subtitle beneath bubble titles on the auth cards — the rotated yellow words.
  static const TextStyle cardCopy = TextStyle(
    color: AppColors.accentGold,
    fontSize: 14,
    fontWeight: FontWeight.w700,
    fontStyle: FontStyle.italic,
    letterSpacing: 0.5,
  );

  static const TextStyle button = TextStyle(
    color: AppColors.bgDark,
    fontSize: 14,
    fontWeight: FontWeight.w900,
    letterSpacing: 2,
  );

  static const TextStyle input = TextStyle(
    color: AppColors.textBright,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: 1,
  );

  static const TextStyle link = TextStyle(
    color: AppColors.accentAqua,
    fontSize: 13,
    fontWeight: FontWeight.w800,
    letterSpacing: 1,
  );

  static const TextStyle error = TextStyle(
    color: AppColors.errorText,
    fontSize: 13,
    fontWeight: FontWeight.w600,
  );
}

// Builds the MaterialApp ThemeData used at the app root. Most of our widgets
// style themselves, but this gives sensible defaults for Material primitives.
ThemeData buildAppTheme()
{
  return ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.bgDark,
    primaryColor: AppColors.accentCoral,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.accentCoral,
      secondary: AppColors.accentAqua,
      surface: AppColors.bgDark,
      error: AppColors.errorText,
    ),
    textTheme: const TextTheme(
      bodyMedium: AppTextStyles.body,
      bodyLarge: AppTextStyles.body,
      titleLarge: AppTextStyles.heading,
    ),
    useMaterial3: true,
  );
}
