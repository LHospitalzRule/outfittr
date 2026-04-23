// OutfitPreviewTab — first bottom-nav tab. Shows the outfit name input, the
// Professor model preview, the 4 slot tiles, and a save button.

import 'package:flutter/material.dart';

import '../models/item.dart';
import '../models/outfit.dart';
import '../services/outfit_service.dart';
import '../theme/app_theme.dart';
import 'graffiti_button.dart';
import 'graffiti_text_field.dart';
import 'model_preview_card.dart';
import 'slot_tile.dart';

class OutfitPreviewTab extends StatefulWidget
{
  // The outfit currently being edited; null means we're building a brand new one.
  final Outfit? editing;
  // Pool of items available to drop into slots — from the Items tab.
  final List<Item> items;
  // Called after a successful save so the parent can refresh its outfits list.
  final VoidCallback onSaved;

  const OutfitPreviewTab({
    super.key,
    required this.editing,
    required this.items,
    required this.onSaved,
  });

  @override
  State<OutfitPreviewTab> createState() => _OutfitPreviewTabState();
}

class _OutfitPreviewTabState extends State<OutfitPreviewTab>
{
  final _nameCtrl = TextEditingController();
  Item? _hat, _shirt, _pants, _shoes;
  bool _saving = false;

  @override
  void initState()
  {
    super.initState();
    _hydrateFromOutfit();
  }

  @override
  void didUpdateWidget(covariant OutfitPreviewTab oldWidget)
  {
    super.didUpdateWidget(oldWidget);
    // When the parent switches which outfit we're editing, reset form state.
    if (oldWidget.editing?.id != widget.editing?.id)
    {
      _hydrateFromOutfit();
    }
  }

  // Fills name + slots from the currently-edited outfit, or clears them for a
  // fresh outfit. Matches slots to items by item type string.
  void _hydrateFromOutfit()
  {
    final outfit = widget.editing;
    _nameCtrl.text = outfit?.name ?? '';
    _hat = _findByType(outfit, 'hat');
    _shirt = _findByType(outfit, 'shirt');
    _pants = _findByType(outfit, 'pants');
    _shoes = _findByType(outfit, 'shoes');
    if (mounted) setState(() {});
  }

  // Finds the first item on the outfit whose type matches (case-insensitive).
  Item? _findByType(Outfit? outfit, String type)
  {
    if (outfit == null) return null;
    try
    {
      return outfit.items.firstWhere(
        (i) => i.type.toLowerCase() == type.toLowerCase(),
      );
    }
    catch (_)
    {
      return null;
    }
  }

  @override
  void dispose()
  {
    _nameCtrl.dispose();
    super.dispose();
  }

  // Opens a bottom-sheet picker letting the user pick an item of the given type
  // from the items pool. Filters by item type.
  Future<void> _pickSlot(String type, void Function(Item?) assign) async
  {
    final pool = widget.items.where((i) => i.type.toLowerCase() == type.toLowerCase()).toList();

    final picked = await showModalBottomSheet<Item?>(
      context: context,
      backgroundColor: AppColors.panelDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => _SlotPickerSheet(type: type, pool: pool),
    );

    if (picked != null) assign(picked);
    setState(() {});
  }

  // Submits the form to /addoutfit or /editoutfit depending on whether we
  // started from an existing outfit.
  Future<void> _save() async
  {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty)
    {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Give your outfit a name first')));
      return;
    }

    setState(() => _saving = true);

    final itemIds = [
      if (_hat != null) _hat!.id,
      if (_shirt != null) _shirt!.id,
      if (_pants != null) _pants!.id,
      if (_shoes != null) _shoes!.id,
    ];

    final existing = widget.editing;
    final result = existing == null
        ? await OutfitService.addOutfit(name: name, description: '', itemIds: itemIds)
        : await OutfitService.editOutfit(
            outfitId: existing.id,
            name: name,
            description: existing.description,
            itemIds: itemIds,
          );

    if (!mounted) return;
    setState(() => _saving = false);

    if (!result.success)
    {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(result.error ?? 'Save failed')));
      return;
    }

    widget.onSaved();
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('Outfit saved')));
  }

  @override
  Widget build(BuildContext context)
  {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          GraffitiTextField(
            controller: _nameCtrl,
            placeholder: 'Outfit name',
            bottomBorderOnly: true,
          ),
          const SizedBox(height: 24),
          Center(
            child: ModelPreviewCard(
              hat: _hat,
              shirt: _shirt,
              pants: _pants,
              shoes: _shoes,
            ),
          ),
          const SizedBox(height: 24),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.0,
            children: [
              SlotTile(
                emoji: '🧢',
                typeLabel: 'Hat',
                item: _hat,
                onTap: () => _pickSlot('hat', (item) => _hat = item),
              ),
              SlotTile(
                emoji: '👕',
                typeLabel: 'Shirt',
                item: _shirt,
                onTap: () => _pickSlot('shirt', (item) => _shirt = item),
              ),
              SlotTile(
                emoji: '👖',
                typeLabel: 'Pants',
                item: _pants,
                onTap: () => _pickSlot('pants', (item) => _pants = item),
              ),
              SlotTile(
                emoji: '👟',
                typeLabel: 'Shoes',
                item: _shoes,
                onTap: () => _pickSlot('shoes', (item) => _shoes = item),
              ),
            ],
          ),
          const SizedBox(height: 24),
          GraffitiButton(
            label: _saving ? 'Saving...' : 'Save outfit',
            onPressed: _saving ? null : _save,
            busy: _saving,
          ),
          const SizedBox(height: 90),
        ],
      ),
    );
  }
}

// Bottom-sheet item picker shown when the user taps an empty or filled slot.
class _SlotPickerSheet extends StatelessWidget
{
  final String type;
  final List<Item> pool;

  const _SlotPickerSheet({required this.type, required this.pool});

  @override
  Widget build(BuildContext context)
  {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'PICK A ${type.toUpperCase()}',
              style: AppTextStyles.heading.copyWith(color: AppColors.accentAqua),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            if (pool.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Text(
                  'No $type items yet. Add one from the Items tab.',
                  style: AppTextStyles.body,
                  textAlign: TextAlign.center,
                ),
              )
            else
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 320),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: pool.length,
                  separatorBuilder: (_, _) =>
                      const Divider(color: AppColors.inputBorder, height: 1),
                  itemBuilder: (_, i)
                  {
                    final item = pool[i];
                    return ListTile(
                      leading: item.imageUrl.isNotEmpty
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                item.imageUrl,
                                width: 40,
                                height: 40,
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) =>
                                    const Icon(Icons.image_not_supported),
                              ),
                            )
                          : const Icon(Icons.checkroom, color: AppColors.accentAqua),
                      title: Text(item.name, style: AppTextStyles.input),
                      onTap: () => Navigator.pop(context, item),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
