// GraffitiButton — gold-to-coral gradient pill button matching the frontend's
// primary CTA (ENTER / SIGN UP / etc.). Optional variant switches the gradient
// for secondary actions like the navbar's + NEW ITEM / + NEW OUTFIT.

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

enum GraffitiButtonVariant { primary, aqua, pink, ghost }

class GraffitiButton extends StatelessWidget
{
  final String label;
  final VoidCallback? onPressed;
  final bool busy;
  final GraffitiButtonVariant variant;
  final IconData? icon;

  const GraffitiButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.busy = false,
    this.variant = GraffitiButtonVariant.primary,
    this.icon,
  });

  @override
  Widget build(BuildContext context)
  {
    final gradient = _gradientFor(variant);
    final textColor = variant == GraffitiButtonVariant.ghost
        ? AppColors.textBright
        : AppColors.bgDark;
    final disabled = onPressed == null || busy;

    return Opacity(
      opacity: disabled ? 0.5 : 1.0,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: disabled ? null : onPressed,
          borderRadius: BorderRadius.circular(999),
          child: Ink(
            decoration: BoxDecoration(
              gradient: gradient,
              color: variant == GraffitiButtonVariant.ghost ? Colors.transparent : null,
              borderRadius: BorderRadius.circular(999),
              border: variant == GraffitiButtonVariant.ghost
                  ? Border.all(color: AppColors.textBright, width: 1.5)
                  : null,
              boxShadow: variant == GraffitiButtonVariant.ghost
                  ? null
                  : [
                      BoxShadow(
                        color: AppColors.accentCoral.withValues(alpha: 0.28),
                        offset: const Offset(0, 12),
                        blurRadius: 24,
                      ),
                    ],
            ),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (busy)
                  SizedBox(
                    height: 16,
                    width: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation(textColor),
                    ),
                  )
                else if (icon != null)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Icon(icon, color: textColor, size: 18),
                  ),
                if (!busy)
                  Text(
                    label.toUpperCase(),
                    style: AppTextStyles.button.copyWith(color: textColor),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Returns the appropriate gradient for the requested variant. Ghost returns
  // null since that variant uses a transparent background + border instead.
  LinearGradient? _gradientFor(GraffitiButtonVariant v)
  {
    switch (v)
    {
      case GraffitiButtonVariant.primary:
        return const LinearGradient(
          colors: [AppColors.accentGold, AppColors.accentCoral],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        );
      case GraffitiButtonVariant.aqua:
        return const LinearGradient(
          colors: [AppColors.accentAqua, Color(0xFF2DA88F)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        );
      case GraffitiButtonVariant.pink:
        return const LinearGradient(
          colors: [AppColors.accentGold, AppColors.accentPink],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        );
      case GraffitiButtonVariant.ghost:
        return null;
    }
  }
}
