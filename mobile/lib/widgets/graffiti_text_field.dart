// GraffitiTextField — styled text input with the frontend's dark translucent
// background, faint white border, and uppercase placeholder text.

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class GraffitiTextField extends StatelessWidget
{
  final TextEditingController controller;
  final String placeholder;
  final bool obscureText;
  final TextInputType? keyboardType;
  final bool autocorrect;
  // When true, strips the filled background + border and shows only a bottom
  // border — used for the outfit name field on the Preview tab.
  final bool bottomBorderOnly;
  final void Function(String)? onChanged;

  const GraffitiTextField({
    super.key,
    required this.controller,
    required this.placeholder,
    this.obscureText = false,
    this.keyboardType,
    this.autocorrect = true,
    this.bottomBorderOnly = false,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context)
  {
    if (bottomBorderOnly)
    {
      return TextField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        autocorrect: autocorrect,
        onChanged: onChanged,
        style: AppTextStyles.input.copyWith(fontSize: 22, fontWeight: FontWeight.w900),
        textCapitalization: TextCapitalization.characters,
        decoration: InputDecoration(
          hintText: placeholder.toUpperCase(),
          hintStyle: AppTextStyles.input.copyWith(
            color: AppColors.textPrimary.withValues(alpha: 0.5),
            fontSize: 22,
            fontWeight: FontWeight.w900,
          ),
          enabledBorder: const UnderlineInputBorder(
            borderSide: BorderSide(color: AppColors.accentPink, width: 2),
          ),
          focusedBorder: const UnderlineInputBorder(
            borderSide: BorderSide(color: AppColors.accentPink, width: 3),
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
      );
    }

    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      autocorrect: autocorrect,
      onChanged: onChanged,
      style: AppTextStyles.input,
      decoration: InputDecoration(
        hintText: placeholder.toUpperCase(),
        hintStyle: AppTextStyles.input.copyWith(
          color: AppColors.textPrimary.withValues(alpha: 0.5),
        ),
        filled: true,
        fillColor: AppColors.inputBg,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.inputBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.accentAqua, width: 1.5),
        ),
      ),
    );
  }
}
