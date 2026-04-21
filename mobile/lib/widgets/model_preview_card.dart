// ModelPreviewCard — the framed "professor" model at the center of the Preview
// tab. Stacks equipped clothing images on top of the professor image. Subtle
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

              // Professor head/body image centered in the frame.
              Padding(
                padding: const EdgeInsets.all(24),
                child: Image.asset('assets/images/professor.png', fit: BoxFit.contain),
              ),

              // Equipped clothing layered on top (hat → shirt → pants → shoes).
              if (widget.hat != null) _buildLayer(widget.hat!, top: 24, height: 70),
              if (widget.shirt != null) _buildLayer(widget.shirt!, top: 110, height: 90),
              if (widget.pants != null) _buildLayer(widget.pants!, top: 200, height: 80),
              if (widget.shoes != null) _buildLayer(widget.shoes!, top: 280, height: 50),
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
