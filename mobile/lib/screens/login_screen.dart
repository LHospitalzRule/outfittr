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
  bool _resending = false;
  String? _error;
  String? _resendMessage;
  // True when the backend told us the account isn't verified yet — shows the
  // resend button exactly like the React frontend's showResend state.
  bool _showResend = false;

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

    setState(() { _submitting = true; _error = null; _resendMessage = null; _showResend = false; });
    final result = await AuthService.login(email, password);
    if (!mounted) return;
    setState(() => _submitting = false);

    if (!result.success)
    {
      final errorMsg = result.error ?? 'Login failed';
      setState(() {
        _error = errorMsg;
        // Show the resend button only for the specific unverified-account error.
        _showResend = errorMsg == 'Please verify your email before logging in';
      });
      return;
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const OutfitManagerScreen()),
    );
  }

  // Calls /api/resend-verification with the current email field value.
  Future<void> _resend() async
  {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) return;

    setState(() { _resending = true; _resendMessage = null; _error = null; });
    final result = await AuthService.resendVerification(email);
    if (!mounted) return;
    setState(() => _resending = false);

    if (!result.success)
    {
      setState(() => _error = result.error);
      return;
    }

    setState(() {
      _showResend = false;
      _resendMessage = 'Verification email sent. Please check your inbox.';
    });
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
                    if (_resendMessage != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _resendMessage!,
                        style: AppTextStyles.body.copyWith(color: AppColors.accentAqua),
                        textAlign: TextAlign.center,
                      ),
                    ],
                    if (_showResend) ...[
                      const SizedBox(height: 12),
                      GraffitiButton(
                        label: _resending ? 'Sending...' : 'Resend verification email',
                        variant: GraffitiButtonVariant.ghost,
                        onPressed: (_resending || _emailCtrl.text.trim().isEmpty) ? null : _resend,
                        busy: _resending,
                      ),
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
