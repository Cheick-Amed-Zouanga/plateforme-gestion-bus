import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

class SecondaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool disabled;
  final double? width;
  final IconData? icon;
  final double? fontSize;

  const SecondaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.disabled = false,
    this.width,
    this.icon,
    this.fontSize,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: AppSpacing.buttonHeight,
      child: OutlinedButton(
        onPressed: (isLoading || disabled) ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primaryBlue,
          disabledForegroundColor: AppColors.primaryBlue.withValues(alpha: 0.5),
          side: BorderSide(
            color: disabled
                ? AppColors.primaryBlue.withValues(alpha: 0.5)
                : AppColors.primaryBlue,
            width: 1.5,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor:
                      AlwaysStoppedAnimation<Color>(AppColors.primaryBlue),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 18),
                    const SizedBox(width: AppSpacing.sm),
                  ],
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: fontSize ?? 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
