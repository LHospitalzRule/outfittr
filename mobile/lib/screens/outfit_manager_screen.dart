// OutfitManagerScreen — home after login. Bottom tab nav with Preview (build /
// edit an outfit with the Professor model), Items (wardrobe grid), and Outfits
// (saved-outfits list). Shares a custom pink "OUTFITTR" navbar across tabs.

import 'package:flutter/material.dart';

import '../models/item.dart';
import '../models/outfit.dart';
import '../services/auth_service.dart';
import '../services/item_service.dart';
import '../services/outfit_service.dart';
import '../theme/app_theme.dart';
import '../widgets/graffiti_background.dart';
import '../widgets/items_tab.dart';
import '../widgets/outfit_preview_tab.dart';
import '../widgets/outfits_tab.dart';
import 'login_screen.dart';

class OutfitManagerScreen extends StatefulWidget
{
  const OutfitManagerScreen({super.key});

  @override
  State<OutfitManagerScreen> createState() => _OutfitManagerScreenState();
}

class _OutfitManagerScreenState extends State<OutfitManagerScreen>
{
  int _tabIndex = 0;
  List<Outfit> _outfits = [];
  // Items list is populated from outfits' embedded items (deduped by id) since
  // mobile has no standalone ItemService yet.
  List<Item> _items = [];
  Outfit? _editing;
  bool _loading = true;
  String? _error;

  @override
  void initState()
  {
    super.initState();
    _load();
  }

  // Fetches the outfit list. If the JWT is expired, AuthService.logout has
  // already run — bounce back to Login in that case.
  Future<void> _load() async
  {
    setState(() { _loading = true; _error = null; });
    final result = await OutfitService.listOutfits();
    if (!mounted) return;

    if (!result.success)
    {
      final loggedIn = await AuthService.isLoggedIn();
      if (!mounted) return;
      if (!loggedIn)
      {
        _goToLogin();
        return;
      }
      setState(() { _loading = false; _error = result.error; });
      return;
    }

    // Load items in parallel so the slot picker is always up to date.
    final itemResult = await ItemService.searchItems('');
    if (!mounted) return;

    setState(() {
      _loading = false;
      _outfits = result.data ?? [];
      _items = itemResult.success ? (itemResult.data ?? []) : [];
    });
  }

  Future<void> _logout() async
  {
    await AuthService.logout();
    if (!mounted) return;
    _goToLogin();
  }

  void _goToLogin()
  {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  // Prompts for confirmation, deletes the outfit, and refreshes the list.
  Future<void> _confirmDelete(Outfit outfit) async
  {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.panelDark,
        title: Text('Delete "${outfit.name}"?', style: AppTextStyles.heading),
        content: const Text('This cannot be undone.', style: AppTextStyles.body),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('CANCEL', style: AppTextStyles.link),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              'DELETE',
              style: AppTextStyles.link.copyWith(color: AppColors.errorText),
            ),
          ),
        ],
      ),
    );
    if (ok != true) return;

    final result = await OutfitService.deleteOutfit(outfit.id);
    if (!mounted) return;

    if (!result.success)
    {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(result.error ?? 'Delete failed')));
      return;
    }

    // If we were editing the outfit we just deleted, clear the editor.
    if (_editing?.id == outfit.id)
    {
      setState(() => _editing = null);
    }
    await _load();
  }

  // Switches to the Preview tab seeded with the given outfit for editing.
  void _editOutfit(Outfit outfit)
  {
    setState(() {
      _editing = outfit;
      _tabIndex = 0;
    });
  }

  // Clears the editor state and jumps to the Preview tab to start a new outfit.
  void _startNewOutfit()
  {
    setState(() {
      _editing = null;
      _tabIndex = 0;
    });
  }

  @override
  Widget build(BuildContext context)
  {
    return Scaffold(
      extendBody: true,
      body: GraffitiBackground(
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              _Navbar(onLogout: _logout),
              Expanded(child: _buildBody()),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  // Picks which tab's content to render based on _tabIndex, or a loading /
  // error placeholder if we're still fetching.
  Widget _buildBody()
  {
    if (_loading)
    {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.accentCoral),
      );
    }
    if (_error != null)
    {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'Error: $_error',
            style: AppTextStyles.error,
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    // IndexedStack preserves each tab's state when the user switches between them.
    return IndexedStack(
      index: _tabIndex,
      children: [
        OutfitPreviewTab(
          editing: _editing,
          items: _items,
          onSaved: _load,
        ),
        ItemsTab(onItemsChanged: _load),
        OutfitsTab(
          outfits: _outfits,
          onEdit: _editOutfit,
          onDelete: _confirmDelete,
          onCreate: _startNewOutfit,
        ),
      ],
    );
  }

  // Themed bottom nav that matches the dark brand palette.
  Widget _buildBottomNav()
  {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.black87,
        border: Border(top: BorderSide(color: AppColors.accentPink, width: 2)),
      ),
      child: BottomNavigationBar(
        currentIndex: _tabIndex,
        onTap: (i) => setState(() => _tabIndex = i),
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedItemColor: AppColors.accentAqua,
        unselectedItemColor: AppColors.textPrimary.withValues(alpha: 0.6),
        selectedLabelStyle: AppTextStyles.input.copyWith(fontSize: 11),
        unselectedLabelStyle: AppTextStyles.input.copyWith(fontSize: 11),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'PREVIEW'),
          BottomNavigationBarItem(icon: Icon(Icons.checkroom), label: 'ITEMS'),
          BottomNavigationBarItem(icon: Icon(Icons.style_outlined), label: 'OUTFITS'),
        ],
      ),
    );
  }
}

// Custom top navbar — pink logo badge on the left, logout button on the right.
class _Navbar extends StatelessWidget
{
  final VoidCallback onLogout;

  const _Navbar({required this.onLogout});

  @override
  Widget build(BuildContext context)
  {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: const BoxDecoration(
        color: Colors.black87,
        border: Border(bottom: BorderSide(color: AppColors.accentPink, width: 2)),
      ),
      child: Row(
        children: [
          // "OUTFITTR" logo badge — pink background with aqua offset shadow to
          // echo the frontend navbar's box-shadow trick.
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.accentPink,
              borderRadius: BorderRadius.circular(6),
              boxShadow: const [
                BoxShadow(
                  color: AppColors.accentAqua,
                  offset: Offset(3, 3),
                  blurRadius: 0,
                ),
              ],
            ),
            child: const Text(
              'OUTFITTR',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
              ),
            ),
          ),
          const Spacer(),
          // Ghost-style LOG OUT button with a white border.
          OutlinedButton(
            onPressed: onLogout,
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Colors.white, width: 1.2),
              shape: const StadiumBorder(),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            ),
            child: const Text(
              'LOG OUT',
              style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1.2, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
