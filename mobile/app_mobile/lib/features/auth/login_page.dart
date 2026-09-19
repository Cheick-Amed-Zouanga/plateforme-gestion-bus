import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/services/auth_service.dart';
import 'auth_design.dart';
import 'register_page.dart';

class LoginPage extends StatefulWidget {
  final bool popOnSuccess;
  const LoginPage({super.key, this.popOnSuccess = false});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      await login(
        username: _usernameController.text.trim(),
        password: _passwordController.text,
      );
      if (!mounted) return;
      if (widget.popOnSuccess && Navigator.canPop(context)) {
        Navigator.pop(context, true);
      } else {
        Navigator.pushNamedAndRemoveUntil(context, '/home', (_) => false);
      }
    } on AuthException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (_) {
      setState(() => _errorMessage = 'Impossible de joindre le serveur.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _continueAsGuest() async {
    await AuthService.instance.continueAsGuest();
    if (!mounted) return;
    Navigator.pushNamedAndRemoveUntil(context, '/home', (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: authTheme(context),
      child: Scaffold(
        body: SafeArea(
          top: false,
          child: SingleChildScrollView(
            child: Column(
              children: [
                _Hero(),
                Transform.translate(
                  offset: const Offset(0, -34),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(24, 30, 24, 30),
                    decoration: const BoxDecoration(
                      color: AuthPalette.background,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(42),
                        topRight: Radius.circular(18),
                      ),
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Ravi de vous revoir.',
                            style: GoogleFonts.manrope(
                              color: Colors.white,
                              fontSize: 29,
                              height: 1.08,
                              letterSpacing: -1,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 7),
                          Text(
                            'Retrouvez vos trajets et vos billets.',
                            style: GoogleFonts.manrope(
                              color: AuthPalette.body,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 22),
                          _TravelCredentials(
                            usernameController: _usernameController,
                            passwordController: _passwordController,
                            obscurePassword: _obscurePassword,
                            onTogglePassword: () => setState(
                              () => _obscurePassword = !_obscurePassword,
                            ),
                            onSubmitted: _handleLogin,
                          ),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () {},
                              child: const Text('Identifiants oubliés ?'),
                            ),
                          ),
                          if (_errorMessage != null) ...[
                            AuthErrorBanner(_errorMessage!),
                            const SizedBox(height: 14),
                          ],
                          AuthPrimaryButton(
                            label: 'Se connecter',
                            loading: _loading,
                            onPressed: _handleLogin,
                          ),
                          const SizedBox(height: 20),
                          Row(
                            children: [
                              const Expanded(
                                child: Divider(color: AuthPalette.border),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                ),
                                child: Text(
                                  'Pas encore de compte ?',
                                  style: GoogleFonts.manrope(
                                    color: AuthPalette.body,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                              const Expanded(
                                child: Divider(color: AuthPalette.border),
                              ),
                            ],
                          ),
                          Center(
                            child: TextButton(
                              onPressed: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const RegisterPage(),
                                ),
                              ),
                              child: const Text('Créer un compte'),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Center(
                            child: TextButton.icon(
                              onPressed: _continueAsGuest,
                              icon: const Icon(
                                Icons.route_outlined,
                                color: AuthPalette.body,
                                size: 20,
                              ),
                              label: const Text(
                                'Explorer les trajets',
                                style: TextStyle(color: Colors.white),
                              ),
                              iconAlignment: IconAlignment.start,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    height: 410,
    color: AuthPalette.forest,
    child: Stack(
      fit: StackFit.expand,
      children: [
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          height: 235,
          child: Image.asset(
            'assets/images/auth_moving_horizon.png',
            fit: BoxFit.cover,
            alignment: Alignment.center,
          ),
        ),
        Positioned(
          left: 24,
          right: 24,
          top: MediaQuery.paddingOf(context).top + 22,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const AuthWordmark(light: true),
              const SizedBox(height: 25),
              Text(
                'Tout le voyage,\ndans votre poche.',
                style: GoogleFonts.manrope(
                  color: Colors.white,
                  fontSize: 33,
                  height: 1.02,
                  letterSpacing: -1.25,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'DES VILLES PLUS PROCHES\nDES HORIZONS PLUS GRANDS',
                style: GoogleFonts.manrope(
                  color: Colors.white.withValues(alpha: .9),
                  fontSize: 10,
                  height: 1.55,
                  letterSpacing: 2.2,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _TravelCredentials extends StatelessWidget {
  final TextEditingController usernameController;
  final TextEditingController passwordController;
  final bool obscurePassword;
  final VoidCallback onTogglePassword;
  final VoidCallback onSubmitted;

  const _TravelCredentials({
    required this.usernameController,
    required this.passwordController,
    required this.obscurePassword,
    required this.onTogglePassword,
    required this.onSubmitted,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
    decoration: BoxDecoration(
      color: AuthPalette.panel,
      borderRadius: BorderRadius.circular(22),
      border: Border.all(color: AuthPalette.border),
    ),
    child: Column(
      children: [
        _CredentialRow(
          icon: Icons.mail_outline_rounded,
          label: 'Email ou identifiant',
          controller: usernameController,
          hint: 'Votre identifiant',
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.username, AutofillHints.email],
          validator: (value) => value == null || value.trim().isEmpty
              ? 'Saisissez votre identifiant'
              : null,
        ),
        const Padding(
          padding: EdgeInsets.only(left: 54),
          child: Divider(height: 1, color: AuthPalette.border),
        ),
        _CredentialRow(
          icon: Icons.lock_outline_rounded,
          label: 'Mot de passe',
          controller: passwordController,
          hint: 'Votre mot de passe',
          obscureText: obscurePassword,
          trailing: IconButton(
            tooltip: obscurePassword
                ? 'Afficher le mot de passe'
                : 'Masquer le mot de passe',
            onPressed: onTogglePassword,
            icon: Icon(
              obscurePassword
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
              color: AuthPalette.body,
            ),
          ),
          onSubmitted: (_) => onSubmitted(),
          validator: (value) => value == null || value.isEmpty
              ? 'Saisissez votre mot de passe'
              : null,
        ),
      ],
    ),
  );
}

class _CredentialRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final TextEditingController controller;
  final String hint;
  final bool obscureText;
  final Widget? trailing;
  final TextInputType? keyboardType;
  final Iterable<String>? autofillHints;
  final ValueChanged<String>? onSubmitted;
  final String? Function(String?)? validator;

  const _CredentialRow({
    required this.icon,
    required this.label,
    required this.controller,
    required this.hint,
    this.obscureText = false,
    this.trailing,
    this.keyboardType,
    this.autofillHints,
    this.onSubmitted,
    this.validator,
  });

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: const EdgeInsets.only(top: 17),
        child: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: AuthPalette.forest),
          ),
          child: Icon(icon, color: AuthPalette.forest, size: 19),
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          autofillHints: autofillHints,
          textInputAction: onSubmitted == null
              ? TextInputAction.next
              : TextInputAction.done,
          onFieldSubmitted: onSubmitted,
          style: GoogleFonts.manrope(color: Colors.white, fontSize: 15),
          decoration: InputDecoration(
            labelText: label,
            labelStyle: GoogleFonts.manrope(
              color: AuthPalette.body,
              fontSize: 12,
            ),
            hintText: hint,
            filled: false,
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            errorBorder: InputBorder.none,
            focusedErrorBorder: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(vertical: 10),
            suffixIcon: trailing,
          ),
          validator: validator,
        ),
      ),
    ],
  );
}
