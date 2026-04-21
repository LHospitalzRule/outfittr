// LoginScreen — email + password sign-in against /api/login. Styled to match
// the React frontend's graffiti-themed LoginPage.

import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/bubble_title.dart';
import '../widgets/graffiti_background.dart';
import '../widgets/graffiti_button.dart';
import '../widgets/graffiti_card.dart';
import '../widgets/graffiti_text_field.dart';
import 'outfit_manager_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget
{
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
{
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose()
  {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  // Validates inputs, calls AuthService.login, and either routes to OutfitManager
  // or surfaces the backend error inline under the form.
  Future<void> _submit() async
  {
    final email = _emailCtrl.text.trim();
    final password = _passwordCtrl.text;

    if (email.isEmpty || password.isEmpty)
    {
      setState(() => _error = 'Enter an email and password');
      return;
    }

    setState(() { _submitting = true; _error = null; });
    final result = await AuthService.login(email, password);
    if (!mounted) return;
    setState(() => _submitting = false);

    if (!result.success)
    {
      setState(() => _error = result.error ?? 'Login failed');
      return;
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const OutfitManagerScreen()),
    );
  }

  @override
  Widget build(BuildContext context)
  {
    return Scaffold(
      body: GraffitiBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
              child: GraffitiCard(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(child: BubbleTitle(lines: ['OUTFITTR'], fontSize: 40)),
                    const SizedBox(height: 16),
                    const Text(
                      'Sign in to search your wardrobe and add the next piece to your collection.',
                      style: AppTextStyles.cardCopy,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 28),
                    GraffitiTextField(
                      controller: _emailCtrl,
                      placeholder: 'Email',
                      keyboardType: TextInputType.emailAddress,
                      autocorrect: false,
                    ),
                    const SizedBox(height: 14),
                    GraffitiTextField(
                      controller: _passwordCtrl,
                      placeholder: 'Password',
                      obscureText: true,
                      autocorrect: false,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, style: AppTextStyles.error, textAlign: TextAlign.center),
                    ],
                    const SizedBox(height: 24),
                    GraffitiButton(
                      label: _submitting ? 'Entering...' : 'Enter',
                      onPressed: _submitting ? null : _submit,
                      busy: _submitting,
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('New here? ', style: AppTextStyles.body),
                        GestureDetector(
                          onTap: _submitting
                              ? null
                              : () => Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => const RegisterScreen()),
                                  ),
                          child: const Text('SIGN UP', style: AppTextStyles.link),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
