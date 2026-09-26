import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../buttons/primary_button.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final String? buttonLabel;
  final VoidCallback? onButtonTap;
  final Color? iconColor;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    this.buttonLabel,
    this.onButtonTap,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.xxl,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: (iconColor ?? AppColors.primaryBlue).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Icon(
                  icon,
                  size: 40,
                  color: iconColor ?? AppColors.primaryBlue,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),

            // Title
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.navy,
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // Description
            Text(
              description,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textGrey,
                height: 1.5,
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),

            // Button
            if (buttonLabel != null && onButtonTap != null)
              PrimaryButton(
                label: buttonLabel!,
                onPressed: onButtonTap,
              ),
          ],
        ),
      ),
    );
  }
}

/// Variants d'EmptyState
class NoResultsEmpty extends StatelessWidget {
  final VoidCallback? onRetry;

  const NoResultsEmpty({
    super.key,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.search_off_rounded,
      title: 'Aucun résultat trouvé',
      description: 'Modifiez votre recherche et réessayez',
      buttonLabel: 'Nouvelle recherche',
      onButtonTap: onRetry,
      iconColor: AppColors.orange,
    );
  }
}

class NoTicketsEmpty extends StatelessWidget {
  final VoidCallback? onSearchTrip;

  const NoTicketsEmpty({
    super.key,
    this.onSearchTrip,
  });

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.event_busy_rounded,
      title: 'Aucun billet pour le moment',
      description: 'Réservez votre premier trajet maintenant',
      buttonLabel: 'Rechercher un trajet',
      onButtonTap: onSearchTrip,
      iconColor: AppColors.teal,
    );
  }
}

class NoConnectionEmpty extends StatelessWidget {
  final VoidCallback? onRetry;

  const NoConnectionEmpty({
    super.key,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.wifi_off_rounded,
      title: 'Pas de connexion',
      description: 'Vérifiez votre connexion Internet et réessayez',
      buttonLabel: 'Réessayer',
      onButtonTap: onRetry,
      iconColor: AppColors.errorRed,
    );
  }
}
