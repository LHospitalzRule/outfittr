// ModelPreviewCard — the framed stick-figure model at the center of the Preview
// tab. Stacks equipped clothing images on top of the figure. Subtle
// one-shot entry rotation, no continuous spin (per mobile design decisions).

import 'package:flutter/material.dart';

import '../models/item.dart';
import '../theme/app_theme.dart';

class ModelPreviewCard extends StatefulWidget
{
  final Item? hat;
  final Item? shirt;
  final Item? pants;
  final Item? shoes;

  const ModelPreviewCard({
    super.key,
    this.hat,
    this.shirt,
    this.pants,
    this.shoes,
  });

  @override
  State<ModelPreviewCard> createState() => _ModelPreviewCardState();
}

class _ModelPreviewCardState extends State<ModelPreviewCard>
    with SingleTickerProviderStateMixin
{
  late final AnimationController _entryController;
  late final Animation<double> _entryAnimation;

  @override
  void initState()
  {
    super.initState();
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    // Starts tilted, settles to straight — a one-shot bounce-in effect.
    _entryAnimation = Tween<double>(begin: -0.08, end: 0).animate(
      CurvedAnimation(parent: _entryController, curve: Curves.easeOutBack),
    );
    _entryController.forward();
  }

  @override
  void dispose()
  {
    _entryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context)
  {
    return AnimatedBuilder(
      animation: _entryAnimation,
      builder: (context, child)
      {
        return Transform.rotate(angle: _entryAnimation.value, child: child);
      },
      child: Container(
        width: 260,
        height: 340,
        decoration: BoxDecoration(
          color: AppColors.bgDark.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.inputBorder, width: 2),
          boxShadow: [
            BoxShadow(
              color: AppColors.accentAqua.withValues(alpha: 0.35),
              offset: const Offset(-6, 0),
              blurRadius: 24,
            ),
            BoxShadow(
              color: AppColors.accentPink.withValues(alpha: 0.35),
              offset: const Offset(6, 0),
              blurRadius: 24,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Radial gradient backdrop — stands in for the frontend's conic spinner.
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      colors: [
                        AppColors.accentGold.withValues(alpha: 0.2),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),

              // Stick figure base — centered in the frame with padding on all sides.
              Padding(
                padding: const EdgeInsets.all(24),
                child: Image.asset('assets/images/figure.png', fit: BoxFit.contain),
              ),

              // Clothing layers positioned to match the stick figure's anatomy.
              // Card height = 340, figure display area = y:24→316 (292px).
              // Head  ≈ top 25%  → y 20–92
              // Torso ≈ 25–55%   → y 92–188
              // Hips  ≈ 55–78%   → y 188–270
              // Feet  ≈ 78–100%  → y 270–316
              if (widget.hat != null)   _buildLayer(widget.hat!,   top: 20,  height: 72),
              if (widget.shirt != null) _buildLayer(widget.shirt!, top: 92,  height: 96),
              if (widget.pants != null) _buildLayer(widget.pants!, top: 188, height: 82),
              if (widget.shoes != null) _buildLayer(widget.shoes!, top: 270, height: 46),
            ],
          ),
        ),
      ),
    );
  }

  // Renders a single clothing layer as an overlayed image. Uses imageUrl when
  // available; otherwise shows nothing (filled slot without image still exists).
  Widget _buildLayer(Item item, {required double top, required double height})
  {
    if (item.imageUrl.isEmpty) return const SizedBox.shrink();
    return Positioned(
      top: top,
      left: 0,
      right: 0,
      height: height,
      child: Image.network(
        item.imageUrl,
        fit: BoxFit.contain,
        errorBuilder: (_, _, _) => const SizedBox.shrink(),
      ),
    );
  }
}
