import 'package:flutter/material.dart';
import '../../core/services/auth_service.dart';
import '../../core/theme/app_theme.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _pageController = PageController();

  // Étape 1 — Informations personnelles
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _telephoneController = TextEditingController();
  DateTime? _dateNaissance;

  // Étape 2 — Identifiants
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  // Étape 3 — Contact de confiance (optionnel)
  final _contactNomController = TextEditingController();
  final _contactTelController = TextEditingController();
  String _contactRelation = 'AUTRE';

  int _currentStep = 0;
  bool _loading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _telephoneController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _contactNomController.dispose();
    _contactTelController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (!_formKey.currentState!.validate()) return;
    if (_currentStep == 0 && _dateNaissance == null) {
      setState(() => _errorMessage = 'Veuillez sélectionner votre date de naissance.');
      return;
    }
    setState(() {
      _errorMessage = null;
      _currentStep++;
    });
    _pageController.animateToPage(
      _currentStep,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _previousStep() {
    setState(() {
      _errorMessage = null;
      _currentStep--;
    });
    _pageController.animateToPage(
      _currentStep,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final dateStr =
          '${_dateNaissance!.year.toString().padLeft(4, '0')}-'
          '${_dateNaissance!.month.toString().padLeft(2, '0')}-'
          '${_dateNaissance!.day.toString().padLeft(2, '0')}';

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
          content: Text('Inscription réussie ! Vous pouvez vous connecter.'),
          backgroundColor: AppColors.primaryBlue,
        ),
      );
      Navigator.pop(context);
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
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.primaryBlue,
            onPrimary: AppColors.white,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        _dateNaissance = picked;
        _errorMessage = null;
      });
    }
  }

  Widget _buildStepIndicator() {
    const labels = ['Profil', 'Identifiants', 'Contact'];
    return Row(
      children: List.generate(3, (i) {
        final isActive = i == _currentStep;
        final isDone = i < _currentStep;
        return Expanded(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDone || isActive
                            ? AppColors.primaryBlue
                            : AppColors.borderGrey,
                      ),
                      child: Center(
                        child: isDone
                            ? const Icon(Icons.check, color: AppColors.white, size: 16)
                            : Text(
                                '${i + 1}',
                                style: TextStyle(
                                  color: isActive ? AppColors.white : AppColors.textGrey,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      labels[i],
                      style: TextStyle(
                        fontSize: 11,
                        color: isActive ? AppColors.primaryBlue : AppColors.textGrey,
                        fontWeight:
                            isActive ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              if (i < 2)
                Expanded(
                  child: Container(
                    height: 2,
                    margin: const EdgeInsets.only(bottom: 20),
                    color: i < _currentStep
                        ? AppColors.primaryBlue
                        : AppColors.borderGrey,
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }

  // ── ÉTAPE 1 : Informations personnelles ──────────────────────────────────
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Informations personnelles',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryBlue,
          ),
        ),
        const SizedBox(height: 20),
        TextFormField(
          controller: _firstNameController,
          decoration: const InputDecoration(
            labelText: 'Prénom',
            prefixIcon: Icon(Icons.person_outline),
          ),
          textInputAction: TextInputAction.next,
          textCapitalization: TextCapitalization.words,
          validator: (v) =>
              (v == null || v.trim().isEmpty) ? 'Champ obligatoire' : null,
        ),
        const SizedBox(height: 14),
        TextFormField(
          controller: _lastNameController,
          decoration: const InputDecoration(
            labelText: 'Nom',
            prefixIcon: Icon(Icons.person_outline),
          ),
          textInputAction: TextInputAction.next,
          textCapitalization: TextCapitalization.words,
          validator: (v) =>
              (v == null || v.trim().isEmpty) ? 'Champ obligatoire' : null,
        ),
        const SizedBox(height: 14),
        TextFormField(
          controller: _emailController,
          decoration: const InputDecoration(
            labelText: 'Email',
            prefixIcon: Icon(Icons.email_outlined),
          ),
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          validator: (v) {
            if (v == null || v.trim().isEmpty) return 'Champ obligatoire';
            if (!RegExp(r'^[\w.-]+@[\w.-]+\.\w+$').hasMatch(v.trim())) {
              return 'Email invalide';
            }
            return null;
          },
        ),
        const SizedBox(height: 14),
        TextFormField(
          controller: _telephoneController,
          decoration: const InputDecoration(
            labelText: 'Téléphone',
            prefixIcon: Icon(Icons.phone_outlined),
          ),
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.next,
          validator: (v) =>
              (v == null || v.trim().isEmpty) ? 'Champ obligatoire' : null,
        ),
        const SizedBox(height: 14),
        GestureDetector(
          onTap: _pickDate,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: _dateNaissance == null && _errorMessage != null
                    ? AppColors.errorRed
                    : AppColors.borderGrey,
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_outlined,
                    color: AppColors.textGrey, size: 20),
                const SizedBox(width: 12),
                Text(
                  _dateNaissance == null
                      ? 'Date de naissance'
                      : '${_dateNaissance!.day.toString().padLeft(2, '0')}/'
                          '${_dateNaissance!.month.toString().padLeft(2, '0')}/'
                          '${_dateNaissance!.year}',
                  style: TextStyle(
                    color: _dateNaissance == null
                        ? AppColors.textGrey
                        : Colors.black87,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ── ÉTAPE 2 : Identifiants ───────────────────────────────────────────────
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Identifiants de connexion',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryBlue,
          ),
        ),
        const SizedBox(height: 20),
        TextFormField(
          controller: _usernameController,
          decoration: const InputDecoration(
            labelText: "Nom d'utilisateur",
            prefixIcon: Icon(Icons.account_circle_outlined),
          ),
          textInputAction: TextInputAction.next,
          validator: (v) =>
              (v == null || v.trim().isEmpty) ? 'Champ obligatoire' : null,
        ),
        const SizedBox(height: 14),
        TextFormField(
          controller: _passwordController,
          obscureText: _obscurePassword,
          decoration: InputDecoration(
            labelText: 'Mot de passe',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
              ),
              onPressed: () =>
                  setState(() => _obscurePassword = !_obscurePassword),
            ),
            helperText: '7-20 caractères, 1 majuscule, 1 caractère spécial',
            helperMaxLines: 2,
          ),
          textInputAction: TextInputAction.next,
          validator: (v) {
            if (v == null || v.isEmpty) return 'Champ obligatoire';
            if (v.length < 7 || v.length > 20) {
              return 'Entre 7 et 20 caractères';
            }
            if (!RegExp(r'[A-Z]').hasMatch(v)) {
              return 'Au moins une majuscule requise';
            }
            if (!RegExp(r'[!@#\$%^&*(),.?":{}|<>]').hasMatch(v)) {
              return 'Au moins un caractère spécial requis';
            }
            return null;
          },
        ),
        const SizedBox(height: 14),
        TextFormField(
          controller: _confirmPasswordController,
          obscureText: _obscureConfirm,
          decoration: InputDecoration(
            labelText: 'Confirmer le mot de passe',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              icon: Icon(
                _obscureConfirm
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
              ),
              onPressed: () =>
                  setState(() => _obscureConfirm = !_obscureConfirm),
            ),
          ),
          textInputAction: TextInputAction.done,
          validator: (v) {
            if (v == null || v.isEmpty) return 'Champ obligatoire';
            if (v != _passwordController.text) {
              return 'Les mots de passe ne correspondent pas';
            }
            return null;
          },
        ),
      ],
    );
  }

  // ── ÉTAPE 3 : Contact de confiance ──────────────────────────────────────
  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Contact de confiance',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryBlue,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Optionnel — requis si vous voyagez mineur.',
          style: TextStyle(color: AppColors.textGrey, fontSize: 13),
        ),
        const SizedBox(height: 20),
        TextFormField(
          controller: _contactNomController,
          decoration: const InputDecoration(
            labelText: 'Nom du contact',
            prefixIcon: Icon(Icons.contact_emergency_outlined),
          ),
          textInputAction: TextInputAction.next,
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: 14),
        TextFormField(
          controller: _contactTelController,
          decoration: const InputDecoration(
            labelText: 'Téléphone du contact',
            prefixIcon: Icon(Icons.phone_outlined),
          ),
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.done,
        ),
        const SizedBox(height: 14),
        DropdownButtonFormField<String>(
          initialValue: _contactRelation,
          decoration: const InputDecoration(
            labelText: 'Relation',
            prefixIcon: Icon(Icons.people_outline),
          ),
          items: const [
            DropdownMenuItem(value: 'PARENT', child: Text('Parent')),
            DropdownMenuItem(value: 'AMI', child: Text('Ami')),
            DropdownMenuItem(value: 'AUTRE', child: Text('Autre')),
          ],
          onChanged: (v) => setState(() => _contactRelation = v ?? 'AUTRE'),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('TERRASO'),
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _previousStep,
              )
            : IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.pop(context),
              ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Inscription',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryBlue,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildStepIndicator(),
                ],
              ),
            ),
            Expanded(
              child: Form(
                key: _formKey,
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 16),
                      child: _buildStep1(),
                    ),
                    SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 16),
                      child: _buildStep2(),
                    ),
                    SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 16),
                      child: _buildStep3(),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
              child: Column(
                children: [
                  if (_errorMessage != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: AppColors.errorRed.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                            color: AppColors.errorRed.withValues(alpha: 0.4)),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: AppColors.errorRed),
                      ),
                    ),
                  ],
                  ElevatedButton(
                    onPressed: _loading
                        ? null
                        : (_currentStep < 2 ? _nextStep : _handleRegister),
                    child: _loading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: AppColors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            _currentStep < 2 ? 'Suivant' : "S'inscrire",
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
