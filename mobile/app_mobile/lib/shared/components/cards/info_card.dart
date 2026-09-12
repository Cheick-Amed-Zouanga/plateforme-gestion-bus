import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

enum InfoCardType {
  info,
  success,
  warning,
  error,
}

extension InfoCardTypeExtension on InfoCardType {
  Color get backgroundColor {
    switch (this) {
      case InfoCardType.info:
        return AppColors.info.withValues(alpha: 0.08);
      case InfoCardType.success:
        return AppColors.success.withValues(alpha: 0.08);
      case InfoCardType.warning:
        return AppColors.warning.withValues(alpha: 0.08);
      case InfoCardType.error:
        return AppColors.errorRed.withValues(alpha: 0.08);
    }
  }

  Color get borderColor {
    switch (this) {
      case InfoCardType.info:
        return AppColors.info.withValues(alpha: 0.3);
      case InfoCardType.success:
        return AppColors.success.withValues(alpha: 0.3);
      case InfoCardType.warning:
        return AppColors.warning.withValues(alpha: 0.3);
      case InfoCardType.error:
        return AppColors.errorRed.withValues(alpha: 0.3);
    }
  }

  Color get textColor {
    switch (this) {
      case InfoCardType.info:
        return AppColors.info;
      case InfoCardType.success:
        return AppColors.success;
      case InfoCardType.warning:
        return AppColors.warning;
      case InfoCardType.error:
        return AppColors.errorRed;
    }
  }

  IconData get icon {
    switch (this) {
      case InfoCardType.info:
        return Icons.info_rounded;
      case InfoCardType.success:
        return Icons.check_circle_rounded;
      case InfoCardType.warning:
        return Icons.warning_amber_rounded;
      case InfoCardType.error:
        return Icons.error_rounded;
    }
  }
}

class InfoCard extends StatelessWidget {
  final String title;
  final String description;
  final InfoCardType type;
  final VoidCallback? onTap;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool showIcon;

  const InfoCard({
    super.key,
    required this.title,
    required this.description,
    this.type = InfoCardType.info,
    this.onTap,
    this.actionLabel,
    this.onAction,
    this.showIcon = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: type.backgroundColor,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
          border: Border.all(
            color: type.borderColor,
            width: 1.5,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with icon and title
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (showIcon) ...[
                  Icon(
                    type.icon,
                    color: type.textColor,
                    size: 20,
                  ),
                  const SizedBox(width: AppSpacing.md),
                ],
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: type.textColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),

            // Description
            Text(
              description,
              style: TextStyle(
                fontSize: 13,
                color: type.textColor.withValues(alpha: 0.8),
                height: 1.4,
              ),
            ),

            // Action button if provided
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: AppSpacing.md),
              GestureDetector(
                onTap: onAction,
                child: Text(
                  actionLabel!,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: type.textColor,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Compact version of InfoCard
class CompactInfoCard extends StatelessWidget {
  final String message;
  final InfoCardType type;
  final VoidCallback? onDismiss;

  const CompactInfoCard({
    super.key,
    required this.message,
    this.type = InfoCardType.info,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: type.backgroundColor,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
        border: Border.all(
          color: type.borderColor,
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          Icon(
            type.icon,
            color: type.textColor,
            size: 18,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: 13,
                color: type.textColor,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (onDismiss != null) ...[
            const SizedBox(width: AppSpacing.md),
            GestureDetector(
              onTap: onDismiss,
              child: Icon(
                Icons.close_rounded,
                color: type.textColor.withValues(alpha: 0.5),
                size: 18,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Price breakdown card (for booking)
class PriceBreakdownCard extends StatelessWidget {
  final Map<String, double> items;
  final double total;
  final String? taxLabel;
  final double? taxAmount;

  const PriceBreakdownCard({
    super.key,
    required this.items,
    required this.total,
    this.taxLabel,
    this.taxAmount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
        border: Border.all(color: AppColors.borderGrey),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Résumé du prix',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.navy,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          ...items.entries.map((entry) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      entry.key,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textBody,
                      ),
                    ),
                    Text(
                      '${entry.value.toStringAsFixed(0)} CFA',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textBody,
                      ),
                    ),
                  ],
                ),
              )),
          if (taxLabel != null && taxAmount != null) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    taxLabel!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textBody,
                    ),
                  ),
                  Text(
                    '${taxAmount!.toStringAsFixed(0)} CFA',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textBody,
                    ),
                  ),
                ],
              ),
            ),
          ],
          Container(
            height: 1,
            color: AppColors.borderGrey,
            margin: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                ),
              ),
              Text(
                '${total.toStringAsFixed(0)} CFA',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryBlue,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
