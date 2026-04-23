// SlotTile — one square in the HAT/SHIRT/PANTS/SHOES grid on the Preview tab.
// Empty state shows a dashed border + emoji + type label; filled state shows a
// gradient background + item thumbnail + item name.

import 'package:flutter/material.dart';

import '../models/item.dart';
import '../theme/app_theme.dart';

class SlotTile extends StatelessWidget
{
  final String emoji;
  final String typeLabel;
  final Item? item;
  final VoidCallback onTap;

  const SlotTile({
    super.key,
    required this.emoji,
    required this.typeLabel,
    required this.item,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context)
  {
    final filled = item != null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: filled
              ? const LinearGradient(
                  colors: [AppColors.accentGold, AppColors.accentAqua, AppColors.accentPink],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: filled ? null : AppColors.inputBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: filled ? Colors.black : AppColors.inputBorder,
            width: 3,
            // Flutter doesn't render dashed borders natively; a solid thin
            // border stands in for the frontend's dashed empty-state look.
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(emoji, style: const TextStyle(fontSize: 22)),
                const SizedBox(width: 6),
                Text(
                  typeLabel.toUpperCase(),
                  style: AppTextStyles.input.copyWith(
                    fontSize: 11,
                    color: filled ? Colors.black : AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            if (filled)
              Expanded(
                child: Center(
                  child: item!.imageUrl.isNotEmpty
                      ? Image.network(
                          item!.imageUrl,
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) =>
                              const Icon(Icons.image_not_supported, color: Colors.black54),
                        )
                      : const Icon(Icons.checkroom, color: Colors.black54, size: 32),
                ),
              )
            else
              const Expanded(child: SizedBox.shrink()),
            Text(
              filled ? item!.name : 'TAP TO ADD',
              style: AppTextStyles.input.copyWith(
                fontSize: 12,
                color: filled ? Colors.black : AppColors.textPrimary.withValues(alpha: 0.7),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
