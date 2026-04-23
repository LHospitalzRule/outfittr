// GraffitiBackground — full-screen dark backdrop with pig.jpg texture and
// radial gradient overlays. Used as the root of every screen to give the app
// its street-art look matching the React frontend.

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class GraffitiBackground extends StatelessWidget
{
  final Widget child;

  const GraffitiBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context)
  {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Base solid dark color underneath everything.
        const ColoredBox(color: AppColors.bgDark),

        // Background texture overlay at low opacity with a subtle color filter, mirroring
        // the frontend's contrast/brightness filter on the texture layer.
        Opacity(
          opacity: 0.18,
          child: Image.asset(
            'assets/images/background.png',
            fit: BoxFit.cover,
            color: AppColors.bgDark,
            colorBlendMode: BlendMode.saturation,
          ),
        ),

        // Coral/pink radial gradient from the top-left — the "hot" paint splash.
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(-0.8, -0.9),
                radius: 1.2,
                colors: [
                  AppColors.accentPink.withValues(alpha: 0.25),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),

        // Aqua radial gradient from the bottom-right.
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(0.9, 0.9),
                radius: 1.1,
                colors: [
                  AppColors.accentAqua.withValues(alpha: 0.22),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),

        // The actual screen content sits on top of all the background layers.
        child,
      ],
    );
  }
}
