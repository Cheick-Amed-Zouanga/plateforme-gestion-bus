import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import 'loading_shimmer.dart';

class TripSkeleton extends StatelessWidget {
  final int count;

  const TripSkeleton({
    super.key,
    this.count = 3,
  });

  @override
  Widget build(BuildContext context) {
    return LoadingShimmer(
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: count,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.lg),
        itemBuilder: (context, index) => const _TripSkeletonCard(),
      ),
    );
  }
}

class _TripSkeletonCard extends StatelessWidget {
  const _TripSkeletonCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
          border: Border.all(color: AppColors.borderGrey),
          color: AppColors.surface,
        ),
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header avec times
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Times
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _SkeletonBox(width: 50, height: 18),
                        const SizedBox(width: AppSpacing.sm),
                        const Text(
                          '→',
                          style: TextStyle(color: AppColors.textGrey),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        _SkeletonBox(width: 50, height: 18),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    _SkeletonBox(width: 80, height: 12),
                  ],
                ),
                // Badge
                _SkeletonBox(width: 70, height: 24),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),

            // Company
            _SkeletonBox(width: 120, height: 12),
            const SizedBox(height: AppSpacing.md),

            // Route
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _SkeletonBox(width: 80, height: 13),
                _SkeletonBox(width: 60, height: 12),
                _SkeletonBox(width: 80, height: 13),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),

            // Footer
            Container(
              padding: const EdgeInsets.only(top: AppSpacing.lg),
              decoration: const BoxDecoration(
                border: Border(
                  top: BorderSide(color: AppColors.borderGrey),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _SkeletonBox(width: 80, height: 20),
                  _SkeletonBox(width: 70, height: 13),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class TicketSkeleton extends StatelessWidget {
  final int count;

  const TicketSkeleton({
    super.key,
    this.count = 2,
  });

  @override
  Widget build(BuildContext context) {
    return LoadingShimmer(
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: count,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.lg),
        itemBuilder: (context, index) => const _TicketSkeletonCard(),
      ),
    );
  }
}

class _TicketSkeletonCard extends StatelessWidget {
  const _TicketSkeletonCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
          border: Border.all(color: AppColors.borderGrey),
          color: AppColors.surface,
        ),
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SkeletonBox(width: 100, height: 12),
                    const SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        _SkeletonBox(width: 60, height: 16),
                        const SizedBox(width: AppSpacing.sm),
                        const Text(
                          '→',
                          style: TextStyle(color: AppColors.textGrey),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        _SkeletonBox(width: 60, height: 16),
                      ],
                    ),
                  ],
                ),
                _SkeletonBox(width: 70, height: 24),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),

            // QR Code
            Container(
              width: double.infinity,
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
                border: Border.all(color: AppColors.borderGrey),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Seat info
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SkeletonBox(width: 40, height: 11),
                    const SizedBox(height: AppSpacing.sm),
                    _SkeletonBox(width: 60, height: 18),
                  ],
                ),
                _SkeletonBox(width: 40, height: 40),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class SearchFormSkeleton extends StatelessWidget {
  const SearchFormSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
        border: Border.all(color: AppColors.borderGrey),
      ),
      child: Column(
        children: [
          _SkeletonBox(width: double.infinity, height: 48),
          const SizedBox(height: AppSpacing.lg),
          _SkeletonBox(width: double.infinity, height: 48),
          const SizedBox(height: AppSpacing.lg),
          _SkeletonBox(width: double.infinity, height: 48),
          const SizedBox(height: AppSpacing.lg),
          _SkeletonBox(width: double.infinity, height: 52),
        ],
      ),
    );
  }
}

class _SkeletonBox extends StatelessWidget {
  final double width;
  final double height;

  const _SkeletonBox({
    required this.width,
    required this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.borderGrey.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(6),
      ),
    );
  }
}

