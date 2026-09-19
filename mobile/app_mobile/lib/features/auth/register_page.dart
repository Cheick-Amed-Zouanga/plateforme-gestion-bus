import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/services/auth_service.dart';
import 'auth_design.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKeys = List.generate(3, (_) => GlobalKey<FormState>());
  final _pageController = PageController();

  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _telephoneController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _contactNomController = TextEditingController();
  final _contactTelController = TextEditingController();

  DateTime? _dateNaissance;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String _contactRelation = 'AUTRE';
  int _currentStep = 0;
  bool _loading = false;
  String? _errorMessage;

  @override
  void dispose() {
    for (final controller in [
      _firstNameController,
      _lastNameController,
      _emailController,
      _telephoneController,
      _usernameController,
      _passwordController,
      _confirmPasswordController,
      _contactNomController,
      _contactTelController,
    ]) {
      controller.dispose();
    }
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _nextStep() async {
    if (!_formKeys[_currentStep].currentState!.validate()) return;
    if (_currentStep == 0 && _dateNaissance == null) {
      setState(() => _errorMessage = 'Sélectionnez votre date de naissance.');
      return;
    }
    if (_currentStep == 2) {
      await _handleRegister();
      return;
    }
    setState(() {
      _errorMessage = null;
      _currentStep += 1;
    });
    await _pageController.animateToPage(
      _currentStep,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
    );
  }

  Future<void> _previousStep() async {
    if (_currentStep == 0) {
      Navigator.pop(context);
      return;
    }
    setState(() {
      _errorMessage = null;
      _currentStep -= 1;
    });
    await _pageController.animateToPage(
      _currentStep,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
    );
  }

  Future<void> _handleRegister() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    final date = _dateNaissance!;
    final dateStr =
        '${date.year.toString().padLeft(4, '0')}-'
        '${date.month.toString().padLeft(2, '0')}-'
        '${date.day.toString().padLeft(2, '0')}';
    try {
      await register(
        username: _usernameController.text.trim(),
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        telephone: _telephoneController.text.trim(),
        dateNaissance: dateStr,
        contactNom: _contactNomController.text.trim(),
        contactTelephone: _contactTelController.text.trim(),
        contactRelation: _contactRelation,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Compte créé — vous êtes connecté.'),
          backgroundColor: AuthPalette.forest,
        ),
      );
      Navigator.pushNamedAndRemoveUntil(context, '/home', (_) => false);
    } on AuthException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (_) {
      setState(() => _errorMessage = 'Impossible de joindre le serveur.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 18, now.month, now.day),
      firstDate: DateTime(1920),
      lastDate: DateTime(now.year - 5),
      helpText: 'Date de naissance',
      builder: (context, child) =>
          Theme(data: authTheme(context), child: child!),
    );
    if (picked != null) {
      setState(() {
        _dateNaissance = picked;
        _errorMessage = null;
      });
    }
  }

  String get _title => switch (_currentStep) {
    0 => 'Faisons\nconnaissance.',
    1 => 'Sécurisez votre\ncompte.',
    _ => 'Une personne\nde confiance.',
  };

  String get _subtitle => switch (_currentStep) {
    0 => 'Vos informations pour préparer vos voyages.',
    1 => 'Choisissez vos identifiants de connexion.',
    _ => 'À prévenir si nécessaire pendant un voyage.',
  };

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: authTheme(context),
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              _Header(onBack: _previousStep),
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _stepPage(0, _buildProfileStep()),
                    _stepPage(1, _buildCredentialsStep()),
                    _stepPage(2, _buildTrustedContactStep()),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 22),
                child: Column(
                  children: [
                    if (_errorMessage != null) ...[
                      AuthErrorBanner(_errorMessage!),
                      const SizedBox(height: 12),
                    ],
                    AuthPrimaryButton(
                      label: _currentStep < 2
                          ? 'Continuer'
                          : 'Créer mon compte',
                      loading: _loading,
                      onPressed: _nextStep,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      switch (_currentStep) {
                        0 => 'À suivre : vos identifiants de connexion.',
                        1 => 'À suivre : votre contact de confiance.',
                        _ =>
                          'Vous pourrez modifier ces informations plus tard.',
                      },
                      textAlign: TextAlign.center,
                      style: GoogleFonts.manrope(
                        color: AuthPalette.body,
                        fontSize: 12,
                      ),
                    ),
                    if (_currentStep == 0)
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Déjà un compte ?  Se connecter'),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _stepPage(int index, Widget fields) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 12),
      child: Form(
        key: _formKeys[index],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'CRÉER UN COMPTE',
              style: GoogleFonts.manrope(
                color: AuthPalette.forest,
                fontSize: 12,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.7,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              _title,
              style: GoogleFonts.manrope(
                color: Colors.white,
                fontSize: 34,
                height: 1.04,
                letterSpacing: -1.25,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              _subtitle,
              style: GoogleFonts.manrope(
                color: AuthPalette.body,
                fontSize: 14,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 21),
            _StepIndicator(currentStep: _currentStep),
            const SizedBox(height: 24),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
              decoration: BoxDecoration(
                color: AuthPalette.panel,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(28),
                  topRight: Radius.circular(12),
                  bottomLeft: Radius.circular(12),
                  bottomRight: Radius.circular(28),
                ),
                border: Border.all(color: AuthPalette.border),
              ),
              child: fields,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileStep() {
    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _field(
                label: 'Prénom',
                controller: _firstNameController,
                hint: 'Votre prénom',
                capitalization: TextCapitalization.words,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _field(
                label: 'Nom',
                controller: _lastNameController,
                hint: 'Votre nom',
                capitalization: TextCapitalization.words,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        _field(
          label: 'Adresse email',
          controller: _emailController,
          hint: 'vous@exemple.com',
          keyboardType: TextInputType.emailAddress,
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return 'Champ obligatoire';
            }
            if (!RegExp(r'^[\w.-]+@[\w.-]+\.\w+$').hasMatch(value.trim())) {
              return 'Adresse email invalide';
            }
            return null;
          },
        ),
        const SizedBox(height: 14),
        _field(
          label: 'Téléphone',
          controller: _telephoneController,
          hint: 'Votre numéro',
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 14),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AuthFieldLabel('Date de naissance'),
            InkWell(
              onTap: _pickDate,
              borderRadius: BorderRadius.circular(12),
              child: InputDecorator(
                decoration: InputDecoration(
                  errorText: _dateNaissance == null && _errorMessage != null
                      ? 'Date obligatoire'
                      : null,
                  suffixIcon: const Icon(
                    Icons.calendar_today_outlined,
                    size: 20,
                    color: AuthPalette.body,
                  ),
                ),
                child: Text(
                  _dateNaissance == null
                      ? 'JJ / MM / AAAA'
                      : '${_dateNaissance!.day.toString().padLeft(2, '0')} / '
                            '${_dateNaissance!.month.toString().padLeft(2, '0')} / '
                            '${_dateNaissance!.year}',
                  style: GoogleFonts.manrope(
                    color: _dateNaissance == null
                        ? const Color(0xFF929D97)
                        : Colors.white,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCredentialsStep() {
    return Column(
      children: [
        _field(
          label: 'Nom d’utilisateur',
          controller: _usernameController,
          hint: 'Choisissez un identifiant',
        ),
        const SizedBox(height: 14),
        _field(
          label: 'Mot de passe',
          controller: _passwordController,
          hint: 'Votre mot de passe',
          obscure: _obscurePassword,
          suffixIcon: IconButton(
            onPressed: () =>
                setState(() => _obscurePassword = !_obscurePassword),
            icon: Icon(
              _obscurePassword
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
              color: AuthPalette.body,
            ),
          ),
          validator: _validatePassword,
        ),
        const SizedBox(height: 7),
        Align(
          alignment: Alignment.centerLeft,
          child: Text(
            '7–20 caractères, une majuscule et un caractère spécial.',
            style: GoogleFonts.manrope(color: AuthPalette.body, fontSize: 11),
          ),
        ),
        const SizedBox(height: 14),
        _field(
          label: 'Confirmer le mot de passe',
          controller: _confirmPasswordController,
          hint: 'Saisissez-le à nouveau',
          obscure: _obscureConfirm,
          suffixIcon: IconButton(
            onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
            icon: Icon(
              _obscureConfirm
                  ? Icons.visibility_outlined
                  : Icons.visibility_off_outlined,
              color: AuthPalette.body,
            ),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) return 'Champ obligatoire';
            if (value != _passwordController.text) {
              return 'Les mots de passe ne correspondent pas';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildTrustedContactStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AuthPalette.sage,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.shield_outlined,
                color: AuthPalette.forest,
                size: 20,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Cette étape est facultative, sauf pour les voyageurs mineurs.',
                  style: GoogleFonts.manrope(
                    color: AuthPalette.forest,
                    fontSize: 12,
                    height: 1.4,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        _field(
          label: 'Nom du contact',
          controller: _contactNomController,
          hint: 'Nom complet',
          capitalization: TextCapitalization.words,
          required: false,
        ),
        const SizedBox(height: 14),
        _field(
          label: 'Téléphone du contact',
          controller: _contactTelController,
          hint: 'Son numéro',
          keyboardType: TextInputType.phone,
          required: false,
        ),
        const SizedBox(height: 14),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AuthFieldLabel('Relation'),
            DropdownButtonFormField<String>(
              initialValue: _contactRelation,
              decoration: const InputDecoration(),
              items: const [
                DropdownMenuItem(value: 'PARENT', child: Text('Parent')),
                DropdownMenuItem(value: 'AMI', child: Text('Ami')),
                DropdownMenuItem(value: 'AUTRE', child: Text('Autre')),
              ],
              onChanged: (value) =>
                  setState(() => _contactRelation = value ?? 'AUTRE'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _field({
    required String label,
    required TextEditingController controller,
    required String hint,
    TextInputType? keyboardType,
    TextCapitalization capitalization = TextCapitalization.none,
    bool obscure = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
    bool required = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AuthFieldLabel(label),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          textCapitalization: capitalization,
          obscureText: obscure,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(hintText: hint, suffixIcon: suffixIcon),
          validator:
              validator ??
              (required
                  ? (value) => value == null || value.trim().isEmpty
                        ? 'Champ obligatoire'
                        : null
                  : null),
        ),
      ],
    );
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) return 'Champ obligatoire';
    if (value.length < 7 || value.length > 20) {
      return 'Entre 7 et 20 caractères';
    }
    if (!RegExp(r'[A-Z]').hasMatch(value)) return 'Ajoutez une majuscule';
    if (!RegExp(r'[!@#\$%^&*(),.?":{}|<>]').hasMatch(value)) {
      return 'Ajoutez un caractère spécial';
    }
    return null;
  }
}

class _Header extends StatelessWidget {
  final VoidCallback onBack;
  const _Header({required this.onBack});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(12, 16, 24, 12),
    child: Row(
      children: [
        IconButton(
          onPressed: onBack,
          tooltip: 'Retour',
          icon: const Icon(Icons.arrow_back_rounded, color: AuthPalette.forest),
        ),
        const Expanded(child: AuthWordmark(centered: true)),
        const SizedBox(width: 48),
      ],
    ),
  );
}

class _StepIndicator extends StatelessWidget {
  final int currentStep;
  const _StepIndicator({required this.currentStep});

  @override
  Widget build(BuildContext context) {
    const labels = ['Profil', 'Identifiants', 'Contact'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Étape ${currentStep + 1} sur 3',
          style: GoogleFonts.manrope(
            color: AuthPalette.body,
            fontSize: 12,
            fontWeight: FontWeight.w800,
            letterSpacing: .8,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
          decoration: BoxDecoration(
            color: AuthPalette.panelRaised,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: List.generate(5, (slot) {
              if (slot.isOdd) {
                final segment = slot ~/ 2;
                return Expanded(
                  child: Container(
                    height: 2,
                    color: segment < currentStep
                        ? AuthPalette.forest
                        : AuthPalette.border,
                  ),
                );
              }
              final index = slot ~/ 2;
              final active = index <= currentStep;
              return Column(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 240),
                    width: index == currentStep ? 32 : 24,
                    height: index == currentStep ? 32 : 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: active ? AuthPalette.forest : AuthPalette.panel,
                      border: Border.all(
                        color: active ? AuthPalette.forest : AuthPalette.border,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${index + 1}',
                      style: GoogleFonts.manrope(
                        color: active ? AuthPalette.ink : AuthPalette.body,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    labels[index],
                    style: GoogleFonts.manrope(
                      color: index == currentStep
                          ? Colors.white
                          : AuthPalette.body,
                      fontSize: 10,
                      fontWeight: index == currentStep
                          ? FontWeight.w800
                          : FontWeight.w500,
                    ),
                  ),
                ],
              );
            }),
          ),
        ),
      ],
    );
  }
}
