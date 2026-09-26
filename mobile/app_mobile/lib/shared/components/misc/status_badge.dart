import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

enum StatusType {
  success,
  error,
  warning,
  info,
  neutral,
}

extension StatusTypeExtension on StatusType {
  Color get backgroundColor {
    switch (this) {
      case StatusType.success:
        return AppColors.success.withValues(alpha: 0.1);
      case StatusType.error:
        return AppColors.errorRed.withValues(alpha: 0.1);
      case StatusType.warning:
        return AppColors.warning.withValues(alpha: 0.1);
      case StatusType.info:
        return AppColors.info.withValues(alpha: 0.1);
      case StatusType.neutral:
        return AppColors.textLight.withValues(alpha: 0.1);
    }
  }

  Color get textColor {
    switch (this) {
      case StatusType.success:
        return AppColors.success;
      case StatusType.error:
        return AppColors.errorRed;
      case StatusType.warning:
        return AppColors.warning;
      case StatusType.info:
        return AppColors.info;
      case StatusType.neutral:
        return AppColors.textGrey;
    }
  }

  IconData get icon {
    switch (this) {
      case StatusType.success:
        return Icons.check_circle_rounded;
      case StatusType.error:
        return Icons.cancel_rounded;
      case StatusType.warning:
        return Icons.warning_amber_rounded;
      case StatusType.info:
        return Icons.info_rounded;
      case StatusType.neutral:
        return Icons.help_outline_rounded;
    }
  }
}

class StatusBadge extends StatelessWidget {
  final String label;
  final StatusType type;
  final bool showIcon;
  final double? width;

  const StatusBadge({
    super.key,
    required this.label,
    required this.type,
    this.showIcon = true,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: type.backgroundColor,
        borderRadius: BorderRadius.circular(AppSpacing.radiusRound),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (showIcon) ...[
            Icon(
              type.icon,
              size: 14,
              color: type.textColor,
            ),
            const SizedBox(width: AppSpacing.xs),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: type.textColor,
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact version (only circle dot + text)
class CompactStatusBadge extends StatelessWidget {
  final String label;
  final StatusType type;

  const CompactStatusBadge({
    super.key,
    required this.label,
    required this.type,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: type.textColor,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: type.textColor,
          ),
        ),
      ],
    );
  }
}
