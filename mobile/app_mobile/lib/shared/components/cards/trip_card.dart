import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

class TripCard extends StatelessWidget {
  final String departure;
  final String departureTime;
  final String arrival;
  final String arrivalTime;
  final String duration;
  final String price;
  final String busCompany;
  final String? badgeLabel;
  final bool isBooked;
  final VoidCallback? onTap;
  final Color? badgeColor;

  const TripCard({
    super.key,
    required this.departure,
    required this.departureTime,
    required this.arrival,
    required this.arrivalTime,
    required this.duration,
    required this.price,
    required this.busCompany,
    this.badgeLabel,
    this.isBooked = false,
    this.onTap,
    this.badgeColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Material(
        color: Colors.transparent,
        child: Card(
          margin: EdgeInsets.zero,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
              border: Border.all(
                color: isBooked ? AppColors.teal : AppColors.borderGrey,
                width: isBooked ? 2 : 1,
              ),
              color: isBooked
                  ? AppColors.tealSoft.withValues(alpha: 0.3)
                  : AppColors.white,
            ),
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              children: [
                // Header avec badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Times
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              departureTime,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.navy,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            const Text(
                              '→',
                              style: TextStyle(
                                color: AppColors.textGrey,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            Text(
                              arrivalTime,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.navy,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          duration,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textGrey,
                          ),
                        ),
                      ],
                    ),
                    // Badge
                    if (badgeLabel != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                          vertical: AppSpacing.xs,
                        ),
                        decoration: BoxDecoration(
                          color: badgeColor ?? AppColors.tealSoft,
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusRound),
                        ),
                        child: Text(
                          badgeLabel!,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: badgeColor == null
                                ? AppColors.teal
                                : Colors.white,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),

                // Company
                Text(
                  busCompany,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textGrey,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // Route
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      departure,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textBody,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      duration,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textGrey,
                      ),
                    ),
                    Text(
                      arrival,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textBody,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),

                // Footer: Price + Action
                Container(
                  padding: const EdgeInsets.only(top: AppSpacing.lg),
                  decoration: const BoxDecoration(
                    border: Border(
                      top: BorderSide(
                        color: AppColors.borderGrey,
                        width: 1,
                      ),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        price,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primaryBlue,
                        ),
                      ),
                      Text(
                        isBooked ? 'Réservé' : 'Voir plus',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isBooked
                              ? AppColors.teal
                              : AppColors.primaryBlue,
                        ),
                      ),
                    ],
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
