// ItemsTab — second bottom-nav tab. UI shell for the wardrobe items grid.
// NOTE: mobile has no ItemService yet, so this tab currently shows whatever
// items the parent screen has (none, until a service is wired up). The search
// field and "+ NEW ITEM" button are scaffolded but non-functional.
// Follow-up: wire this to /api/searchitems, /api/additem, etc.

import 'package:flutter/material.dart';

import '../models/item.dart';
import '../theme/app_theme.dart';
import 'graffiti_button.dart';
import 'graffiti_text_field.dart';

class ItemsTab extends StatefulWidget
{
  final List<Item> items;

  const ItemsTab({super.key, required this.items});

  @override
  State<ItemsTab> createState() => _ItemsTabState();
}

class _ItemsTabState extends State<ItemsTab>
{
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose()
  {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context)
  {
    final filtered = _query.isEmpty
        ? widget.items
        : widget.items.where((i) {
            final q = _query.toLowerCase();
            return i.name.toLowerCase().contains(q) ||
                i.type.toLowerCase().contains(q) ||
                i.tags.any((t) => t.toLowerCase().contains(q));
          }).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          GraffitiTextField(
            controller: _searchCtrl,
            placeholder: 'Search items',
            onChanged: (v) => setState(() => _query = v),
          ),
          const SizedBox(height: 16),
          GraffitiButton(
            label: '+ New item',
            variant: GraffitiButtonVariant.aqua,
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Item creation coming soon — ItemService not wired yet'),
                ),
              );
            },
          ),
          const SizedBox(height: 20),
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Text(
                      widget.items.isEmpty
                          ? 'No items yet.\nConnect an ItemService to fetch your wardrobe.'
                          : 'No items match your search.',
                      style: AppTextStyles.body,
                      textAlign: TextAlign.center,
                    ),
                  )
                : GridView.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.8,
                    ),
                    itemCount: filtered.length,
                    itemBuilder: (_, i) => _ItemCard(item: filtered[i]),
                  ),
          ),
        ],
      ),
    );
  }
}

// A single card in the items grid — thumbnail, name, and type chip.
class _ItemCard extends StatelessWidget
{
  final Item item;

  const _ItemCard({required this.item});

  @override
  Widget build(BuildContext context)
  {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.inputBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: item.imageUrl.isNotEmpty
                  ? Image.network(
                      item.imageUrl,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      errorBuilder: (_, _, _) => const ColoredBox(
                        color: Colors.black26,
                        child: Center(child: Icon(Icons.image_not_supported)),
                      ),
                    )
                  : const ColoredBox(
                      color: Colors.black26,
                      child: Center(child: Icon(Icons.checkroom, color: Colors.white54)),
                    ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            item.name,
            style: AppTextStyles.input.copyWith(fontSize: 13),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.accentPink.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              item.type.toUpperCase(),
              style: AppTextStyles.body.copyWith(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: AppColors.accentPink,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
