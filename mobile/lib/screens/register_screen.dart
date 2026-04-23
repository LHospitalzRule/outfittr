// RegisterScreen — creates a new account via /api/register. Styled to match the
// React frontend's RegisterPage and now includes the CONFIRM password field +
// client-side validation that mirrors the frontend's rules.

import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/bubble_title.dart';
import '../widgets/graffiti_background.dart';
import '../widgets/graffiti_button.dart';
import '../widgets/graffiti_card.dart';
import '../widgets/graffiti_text_field.dart';

// Copy mirrors the frontend's PASSWORD_REQUIREMENTS_MESSAGE constant.
const _passwordRequirementsMessage =
    'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character.';

// Same regex as the frontend's isPasswordValid — keeps clients in sync.
final _passwordRegex = RegExp(r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$');

class RegisterScreen extends StatefulWidget
{
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen>
{
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _submitting = false;
  String? _error;
  String? _successMessage;

  @override
  void dispose()
  {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  // Runs client-side validation, hits the register endpoint, shows feedback,
  // then pops back to Login after a short delay on success.
  Future<void> _submit() async
  {
    final email = _emailCtrl.text.trim();
    final password = _passwordCtrl.text;
    final confirm = _confirmCtrl.text;

    setState(() { _error = null; _successMessage = null; });

    if (email.isEmpty || password.isEmpty)
    {
      setState(() => _error = 'Enter an email and password');
      return;
    }

    if (!_passwordRegex.hasMatch(password))
    {
      setState(() => _error = _passwordRequirementsMessage);
      return;
    }

    if (password != confirm)
    {
      setState(() => _error = 'Passwords do not match.');
      return;
    }

    setState(() => _submitting = true);
    final result = await AuthService.register(email, password);
    if (!mounted) return;
    setState(() => _submitting = false);

    if (!result.success)
    {
      setState(() => _error = result.error ?? 'Registration failed');
      return;
    }

    setState(() => _successMessage = 'Account created — please log in');
    // Short delay so the message is visible before the screen pops.
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    Navigator.of(context).pop();
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
                    const Center(
                      child: BubbleTitle(lines: ['JOIN THE', 'CREW'], fontSize: 36),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Build a personal outfit board for demos, styling ideas, and managing your outfits.',
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
                    const SizedBox(height: 10),
                    Text(
                      _passwordRequirementsMessage,
                      style: AppTextStyles.body.copyWith(
                        fontSize: 12,
                        color: AppColors.textPrimary.withValues(alpha: 0.75),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 14),
                    GraffitiTextField(
                      controller: _confirmCtrl,
                      placeholder: 'Confirm',
                      obscureText: true,
                      autocorrect: false,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, style: AppTextStyles.error, textAlign: TextAlign.center),
                    ],
                    if (_successMessage != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _successMessage!,
                        style: AppTextStyles.body.copyWith(color: AppColors.accentAqua),
                        textAlign: TextAlign.center,
                      ),
                    ],
                    const SizedBox(height: 24),
                    GraffitiButton(
                      label: _submitting ? 'Creating...' : 'Sign up',
                      onPressed: _submitting ? null : _submit,
                      busy: _submitting,
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Already in? ', style: AppTextStyles.body),
                        GestureDetector(
                          onTap: _submitting ? null : () => Navigator.of(context).pop(),
                          child: const Text('LOGIN', style: AppTextStyles.link),
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
