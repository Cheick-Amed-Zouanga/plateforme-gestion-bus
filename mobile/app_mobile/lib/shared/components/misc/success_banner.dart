import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

class SuccessBanner extends StatefulWidget {
  final String message;
  final Duration displayDuration;
  final VoidCallback? onClose;
  final String? actionLabel;
  final VoidCallback? onAction;

  const SuccessBanner({
    super.key,
    required this.message,
    this.displayDuration = const Duration(seconds: 4),
    this.onClose,
    this.actionLabel,
    this.onAction,
  });

  @override
  State<SuccessBanner> createState() => _SuccessBannerState();
}

class _SuccessBannerState extends State<SuccessBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.easeOut));

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );

    _animationController.forward();

    // Auto-dismiss
    Future.delayed(widget.displayDuration, () {
      if (mounted) {
        _animationController.reverse().then((_) {
          if (mounted) {
            widget.onClose?.call();
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Container(
          margin: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.lg,
          ),
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: AppColors.success,
            borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
            boxShadow: [
              BoxShadow(
                color: AppColors.success.withValues(alpha: 0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(
                Icons.check_circle_rounded,
                color: AppColors.white,
                size: 24,
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  widget.message,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.white,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (widget.actionLabel != null && widget.onAction != null) ...[
                const SizedBox(width: AppSpacing.md),
                GestureDetector(
                  onTap: widget.onAction,
                  child: Text(
                    widget.actionLabel!,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.white,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Info Banner
class InfoBanner extends StatefulWidget {
  final String message;
  final Duration displayDuration;
  final VoidCallback? onClose;

  const InfoBanner({
    super.key,
    required this.message,
    this.displayDuration = const Duration(seconds: 4),
    this.onClose,
  });

  @override
  State<InfoBanner> createState() => _InfoBannerState();
}

class _InfoBannerState extends State<InfoBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _animationController.forward();

    Future.delayed(widget.displayDuration, () {
      if (mounted) {
        _animationController.reverse().then((_) {
          if (mounted) {
            widget.onClose?.call();
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, -1),
        end: Offset.zero,
      ).animate(_animationController),
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.lg,
        ),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.info,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
          boxShadow: [
            BoxShadow(
              color: AppColors.info.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            const Icon(
              Icons.info_rounded,
              color: AppColors.white,
              size: 24,
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                widget.message,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.white,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Warning Banner
class WarningBanner extends StatefulWidget {
  final String message;
  final Duration displayDuration;
  final VoidCallback? onClose;

  const WarningBanner({
    super.key,
    required this.message,
    this.displayDuration = const Duration(seconds: 5),
    this.onClose,
  });

  @override
  State<WarningBanner> createState() => _WarningBannerState();
}

class _WarningBannerState extends State<WarningBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _animationController.forward();

    Future.delayed(widget.displayDuration, () {
      if (mounted) {
        _animationController.reverse().then((_) {
          if (mounted) {
            widget.onClose?.call();
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(0, -1),
        end: Offset.zero,
      ).animate(_animationController),
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.lg,
        ),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.warning,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
          boxShadow: [
            BoxShadow(
              color: AppColors.warning.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            const Icon(
              Icons.warning_amber_rounded,
              color: Colors.black,
              size: 24,
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                widget.message,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.black,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
