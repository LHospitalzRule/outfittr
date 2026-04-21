// OutfitsTab — third bottom-nav tab. Search field + list of outfit cards with
// emoji pips for the items in each outfit.

import 'package:flutter/material.dart';

import '../models/outfit.dart';
import '../theme/app_theme.dart';
import 'graffiti_button.dart';
import 'graffiti_text_field.dart';

class OutfitsTab extends StatefulWidget
{
  final List<Outfit> outfits;
  final void Function(Outfit outfit) onEdit;
  final void Function(Outfit outfit) onDelete;
  final VoidCallback onCreate;

  const OutfitsTab({
    super.key,
    required this.outfits,
    required this.onEdit,
    required this.onDelete,
    required this.onCreate,
  });

  @override
  State<OutfitsTab> createState() => _OutfitsTabState();
}

class _OutfitsTabState extends State<OutfitsTab>
{
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose()
  {
    _searchCtrl.dispose();
    super.dispose();
  }

  // Maps an item type to its matching emoji so outfit cards can show pips.
  String _emojiForType(String type)
  {
    switch (type.toLowerCase())
    {
      case 'hat':
        return '🧢';
      case 'shirt':
        return '👕';
      case 'pants':
        return '👖';
      case 'shoes':
        return '👟';
      default:
        return '👕';
    }
  }

  @override
  Widget build(BuildContext context)
  {
    final filtered = _query.isEmpty
        ? widget.outfits
        : widget.outfits.where((o) {
            final q = _query.toLowerCase();
            return o.name.toLowerCase().contains(q) ||
                o.items.any((i) => i.name.toLowerCase().contains(q));
          }).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          GraffitiTextField(
            controller: _searchCtrl,
            placeholder: 'Search outfits',
            onChanged: (v) => setState(() => _query = v),
          ),
          const SizedBox(height: 16),
          GraffitiButton(
            label: '+ New outfit',
            variant: GraffitiButtonVariant.pink,
            onPressed: widget.onCreate,
          ),
          const SizedBox(height: 20),
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Text(
                      widget.outfits.isEmpty
                          ? 'No outfits yet.\nTap "New outfit" to build your first.'
                          : 'No outfits match your search.',
                      style: AppTextStyles.body,
                      textAlign: TextAlign.center,
                    ),
                  )
                : ListView.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (_, i) => _OutfitCard(
                      outfit: filtered[i],
                      emojiForType: _emojiForType,
                      onTap: () => widget.onEdit(filtered[i]),
                      onDelete: () => widget.onDelete(filtered[i]),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

// A single outfit row styled as a card with name + item-type emoji pips.
class _OutfitCard extends StatelessWidget
{
  final Outfit outfit;
  final String Function(String type) emojiForType;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _OutfitCard({
    required this.outfit,
    required this.emojiForType,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context)
  {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.inputBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.inputBorder),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    outfit.name,
                    style: AppTextStyles.heading.copyWith(fontSize: 18),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 4,
                    children: outfit.items
                        .map((i) => Text(emojiForType(i.type), style: const TextStyle(fontSize: 20)))
                        .toList(),
                  ),
                  if (outfit.items.isEmpty)
                    Text(
                      '${outfit.itemIds.length} item(s)',
                      style: AppTextStyles.body.copyWith(
                        color: AppColors.textPrimary.withValues(alpha: 0.6),
                      ),
                    ),
                ],
              ),
            ),
            IconButton(
              onPressed: onDelete,
              icon: const Icon(Icons.delete_outline, color: AppColors.errorText),
              tooltip: 'Delete',
            ),
          ],
        ),
      ),
    );
  }
}
