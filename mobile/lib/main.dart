// Outfittr mobile entrypoint — boots Flutter, checks for a valid JWT, and routes
// the user to either the OutfitManager or the Login screen.

import 'package:flutter/material.dart';

import 'screens/login_screen.dart';
import 'screens/outfit_manager_screen.dart';
import 'services/auth_service.dart';
import 'theme/app_theme.dart';
import 'widgets/graffiti_background.dart';

void main() async
{
  // Required before using any platform plugins (e.g. shared_preferences).
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const OutfittrApp());
}

class OutfittrApp extends StatelessWidget
{
  const OutfittrApp({super.key});

  @override
  Widget build(BuildContext context)
  {
    return MaterialApp(
      title: 'Outfittr',
      theme: buildAppTheme(),
      debugShowCheckedModeBanner: false,
      home: const _AuthGate(),
    );
  }
}

// Decides at startup which screen to show based on whether a valid JWT is stored.
class _AuthGate extends StatefulWidget
{
  const _AuthGate();

  @override
  State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate>
{
  // Null while we're still checking SharedPreferences; true/false once resolved.
  bool? _loggedIn;

  @override
  void initState()
  {
    super.initState();
    _check();
  }

  Future<void> _check() async
  {
    try
    {
      final loggedIn = await AuthService.isLoggedIn();
      if (!mounted) return;
      setState(() => _loggedIn = loggedIn);
    }
    catch (_)
    {
      // On any failure default to showing the login screen rather than hanging.
      if (!mounted) return;
      setState(() => _loggedIn = false);
    }
  }

  @override
  Widget build(BuildContext context)
  {
    if (_loggedIn == null)
    {
      return const Scaffold(
        body: GraffitiBackground(
          child: Center(
            child: CircularProgressIndicator(color: AppColors.accentCoral),
          ),
        ),
      );
    }
    return _loggedIn! ? const OutfitManagerScreen() : const LoginScreen();
  }
}
