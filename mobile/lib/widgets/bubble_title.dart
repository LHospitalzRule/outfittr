// BubbleTitle — renders multi-character graffiti-style titles (e.g. OUTFITTR,
// JOIN THE CREW). Each character is slightly rotated and drop-shadowed to mimic
// the bubble-letter look from the React frontend.

import 'dart:math';

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class BubbleTitle extends StatelessWidget
{
  // Each string in `lines` renders as one stacked row of bubble characters.
  final List<String> lines;
  final double fontSize;

  const BubbleTitle({super.key, required this.lines, this.fontSize = 44});

  @override
  Widget build(BuildContext context)
  {
    // Fixed-seed RNG so the rotation pattern is stable between rebuilds.
    final random = Random(42);

    return Transform.rotate(
      angle: -0.035, // The frontend tilts the whole title ~-2deg.
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: lines.map((line) => _buildLine(line, random)).toList(),
      ),
    );
  }

  // Builds one line of bubble characters with per-char rotation and shadow.
  Widget _buildLine(String line, Random random)
  {
    final chars = line.split('');
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 2,
      children: chars.map((c)
      {
        // Small random tilt per character so the row looks hand-drawn.
        final tilt = (random.nextDouble() - 0.5) * 0.16;
        return Transform.rotate(
          angle: tilt,
          child: Text(
            c,
            style: AppTextStyles.bubble.copyWith(
              fontSize: fontSize,
              shadows: const [
                // Pink offset shadow mimics the frontend's bubble-letter stroke.
                Shadow(color: AppColors.accentPink, offset: Offset(3, 3), blurRadius: 0),
                Shadow(color: AppColors.accentAqua, offset: Offset(-2, -2), blurRadius: 0),
                Shadow(color: Colors.black, offset: Offset(0, 4), blurRadius: 12),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
