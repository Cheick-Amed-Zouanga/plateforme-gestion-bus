import 'dart:async';

import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../shared/components/index.dart';

class HomePage extends StatefulWidget {
  final bool isGuest;
  final VoidCallback onSearch;
  final VoidCallback onTickets;
  final VoidCallback onSettings;

  const HomePage({
    super.key,
    required this.isGuest,
    required this.onSearch,
    required this.onTickets,
    required this.onSettings,
  });

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _carousel = PageController(viewportFraction: 0.92);
  int _slide = 0;
  Timer? _timer;

  static const _slides = [
    (
      title: 'Voyagez simple',
      subtitle: 'Comparez les compagnies et réservez en quelques taps.',
      colors: [AppColors.primaryBlue, AppColors.ink],
      icon: Icons.directions_bus_filled_rounded,
    ),
    (
      title: 'Votre billet QR',
      subtitle: 'Un identifiant unique prêt pour le contrôle à bord.',
      colors: [AppColors.teal, AppColors.orange],
      icon: Icons.qr_code_2_rounded,
    ),
    (
      title: 'Mode invité',
      subtitle: 'Explorez librement. Connectez-vous seulement pour commander.',
      colors: [AppColors.ink, AppColors.primaryBlue],
      icon: Icons.explore_rounded,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!_carousel.hasClients) return;
      final next = (_slide + 1) % _slides.length;
      _carousel.animateToPage(
        next,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _carousel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.md,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.isGuest ? 'Bienvenue' : 'Bon voyage',
                style: const TextStyle(
                  color: AppColors.textGrey,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              const Text(
                'TERRASO',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ),

        // Carrousel avec indicateurs
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Column(
            children: [
              SizedBox(
                height: 170,
                child: PageView.builder(
                  controller: _carousel,
                  itemCount: _slides.length,
                  onPageChanged: (i) => setState(() => _slide = i),
                  itemBuilder: (_, i) {
                    final s = _slides[i];
                    return Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.md),
                      child: Container(
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: s.colors,
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusRound),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment:
                                    MainAxisAlignment.center,
                                children: [
                                  Text(
                                    s.title,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: AppSpacing.md),
                                  Text(
                                    s.subtitle,
                                    style: TextStyle(
                                      color: Colors.white
                                          .withValues(alpha: 0.9),
                                      fontSize: 13,
                                      height: 1.35,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Icon(
                              s.icon,
                              color:
                                  Colors.white.withValues(alpha: 0.9),
                              size: 52,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              // Indicateurs
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_slides.length, (i) {
                  final active = i == _slide;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    margin: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.xs),
                    width: active ? 18 : 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: active
                          ? AppColors.primaryBlue
                          : AppColors.borderGrey,
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusLarge),
                    ),
                  );
                }),
              ),
            ],
          ),
        ),

        const SizedBox(height: AppSpacing.xxl),

        // Quick Actions Grid
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Accès rapide',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.navy,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: AppSpacing.lg,
                crossAxisSpacing: AppSpacing.lg,
                childAspectRatio: 1.25,
                children: [
                  _QuickActionCard(
                    icon: Icons.search_rounded,
                    label: 'Rechercher',
                    subtitle: 'Trouver un trajet',
                    color: AppColors.primaryBlue,
                    onTap: widget.onSearch,
                  ),
                  _QuickActionCard(
                    icon: Icons.confirmation_number_rounded,
                    label: 'Mes billets',
                    subtitle: 'Voir mes tickets',
                    color: AppColors.teal,
                    onTap: widget.onTickets,
                  ),
                  _QuickActionCard(
                    icon: Icons.settings_rounded,
                    label: 'Paramètres',
                    subtitle: 'Profil & préférences',
                    color: AppColors.orange,
                    onTap: widget.onSettings,
                  ),
                  _QuickActionCard(
                    icon: Icons.help_outline_rounded,
                    label: 'Aide',
                    subtitle: 'FAQ & support',
                    color: AppColors.navy,
                    onTap: widget.onSettings,
                  ),
                ],
              ),
            ],
          ),
        ),

        // Guest Mode Info
        if (widget.isGuest) ...[
          const SizedBox(height: AppSpacing.xxl),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: CompactInfoCard(
              message:
                  'Mode invité : explorez librement. Connexion requise pour réserver.',
              type: InfoCardType.info,
            ),
          ),
        ],

        const SizedBox(height: AppSpacing.xxl),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(AppSpacing.radiusXL),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusXL),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSpacing.radiusXL),
            border: Border.all(color: AppColors.borderGrey),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: AppColors.navy,
                ),
              ),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textGrey,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

