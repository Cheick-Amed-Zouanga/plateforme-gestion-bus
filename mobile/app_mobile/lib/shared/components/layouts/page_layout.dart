import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

class PageLayout extends StatelessWidget {
  final String title;
  final Widget child;
  final bool showBackButton;
  final VoidCallback? onBackPressed;
  final List<Widget>? actions;
  final PreferredSizeWidget? appBar;
  final FloatingActionButton? floatingActionButton;
  final EdgeInsets? contentPadding;

  const PageLayout({
    super.key,
    required this.title,
    required this.child,
    this.showBackButton = true,
    this.onBackPressed,
    this.actions,
    this.appBar,
    this.floatingActionButton,
    this.contentPadding,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: appBar ??
          AppBar(
            title: Text(title),
            leading: showBackButton
                ? IconButton(
                    icon: const Icon(Icons.arrow_back_rounded),
                    onPressed: onBackPressed ?? () => Navigator.pop(context),
                  )
                : null,
            automaticallyImplyLeading: false,
            actions: actions,
          ),
      body: Container(
        color: AppColors.background,
        child: SafeArea(
          child: Padding(
            padding: contentPadding ??
                const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.lg,
                ),
            child: child,
          ),
        ),
      ),
      floatingActionButton: floatingActionButton,
    );
  }
}

/// Simple app bar with custom styling
class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool showBackButton;
  final VoidCallback? onBackPressed;
  final List<Widget>? actions;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? elevation;

  const CustomAppBar({
    super.key,
    required this.title,
    this.showBackButton = true,
    this.onBackPressed,
    this.actions,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title),
      leading: showBackButton
          ? IconButton(
              icon: const Icon(Icons.arrow_back_rounded),
              onPressed: onBackPressed ?? () => Navigator.pop(context),
            )
          : null,
      automaticallyImplyLeading: false,
      actions: actions,
      backgroundColor: backgroundColor ?? AppColors.navy,
      foregroundColor: foregroundColor ?? AppColors.white,
      elevation: elevation ?? 0,
    );
  }
}

/// Layout with scrollable content
class ScrollablePageLayout extends StatelessWidget {
  final String title;
  final Widget child;
  final bool showBackButton;
  final VoidCallback? onBackPressed;
  final List<Widget>? actions;
  final FloatingActionButton? floatingActionButton;
  final EdgeInsets? contentPadding;
  final ScrollPhysics? physics;

  const ScrollablePageLayout({
    super.key,
    required this.title,
    required this.child,
    this.showBackButton = true,
    this.onBackPressed,
    this.actions,
    this.floatingActionButton,
    this.contentPadding,
    this.physics,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        leading: showBackButton
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: onBackPressed ?? () => Navigator.pop(context),
              )
            : null,
        automaticallyImplyLeading: false,
        actions: actions,
      ),
      body: Container(
        color: AppColors.background,
        child: SingleChildScrollView(
          physics: physics ?? const AlwaysScrollableScrollPhysics(),
          child: SafeArea(
            child: Padding(
              padding: contentPadding ??
                  const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.lg,
                  ),
              child: child,
            ),
          ),
        ),
      ),
      floatingActionButton: floatingActionButton,
    );
  }
}

/// Layout for forms
class FormPageLayout extends StatelessWidget {
  final String title;
  final List<Widget> children;
  final VoidCallback? onSubmit;
  final String submitButtonLabel;
  final bool showBackButton;
  final VoidCallback? onBackPressed;
  final bool isLoading;
  final EdgeInsets? contentPadding;

  const FormPageLayout({
    super.key,
    required this.title,
    required this.children,
    this.onSubmit,
    this.submitButtonLabel = 'Confirmer',
    this.showBackButton = true,
    this.onBackPressed,
    this.isLoading = false,
    this.contentPadding,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        leading: showBackButton
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: onBackPressed ?? () => Navigator.pop(context),
              )
            : null,
        automaticallyImplyLeading: false,
      ),
      body: Container(
        color: AppColors.background,
        child: SingleChildScrollView(
          child: SafeArea(
            child: Padding(
              padding: contentPadding ??
                  const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg,
                    vertical: AppSpacing.lg,
                  ),
              child: Column(
                children: [
                  ...children,
                  const SizedBox(height: AppSpacing.xxl),
                  SizedBox(
                    width: double.infinity,
                    height: AppSpacing.buttonHeight,
                    child: ElevatedButton(
                      onPressed: isLoading ? null : onSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryBlue,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusLarge),
                        ),
                      ),
                      child: isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  AppColors.white,
                                ),
                              ),
                            )
                          : Text(submitButtonLabel),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
