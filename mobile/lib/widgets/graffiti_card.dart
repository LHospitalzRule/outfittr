// GraffitiCard — the translucent dark panel that holds each auth form. Matches
// the frontend's .login-card styling (rounded corners, subtle border, backdrop).

import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class GraffitiCard extends StatelessWidget
{
  final Widget child;
  final EdgeInsets padding;

  const GraffitiCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(24),
  });

  @override
  Widget build(BuildContext context)
  {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        // Blur whatever lies behind the card so text stays legible over the
        // busy background gradients.
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: AppColors.panelDark,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.inputBorder, width: 1),
            boxShadow: [
              BoxShadow(
                color: AppColors.accentPink.withValues(alpha: 0.15),
                offset: const Offset(0, 16),
                blurRadius: 32,
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}
