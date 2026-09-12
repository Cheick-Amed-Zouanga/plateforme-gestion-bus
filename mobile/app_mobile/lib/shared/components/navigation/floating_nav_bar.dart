import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

class NavBarItem {
  final IconData icon;
  final String label;
  final bool showNotification;

  NavBarItem({
    required this.icon,
    required this.label,
    this.showNotification = false,
  });
}

class FloatingNavBar extends StatefulWidget {
  final List<NavBarItem> items;
  final int selectedIndex;
  final ValueChanged<int> onItemTap;
  final Color? backgroundColor;
  final Color? selectedColor;
  final Color? unselectedColor;

  const FloatingNavBar({
    super.key,
    required this.items,
    required this.selectedIndex,
    required this.onItemTap,
    this.backgroundColor,
    this.selectedColor,
    this.unselectedColor,
  });

  @override
  State<FloatingNavBar> createState() => _FloatingNavBarState();
}

class _FloatingNavBarState extends State<FloatingNavBar> {
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: AppSpacing.elevationXL,
      shadowColor: AppColors.navy.withValues(alpha: 0.18),
      borderRadius: BorderRadius.circular(AppSpacing.radiusRound),
      color: widget.backgroundColor ?? AppColors.white,
      child: Container(
        height: AppSpacing.navBarHeight,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSpacing.radiusRound),
          border: Border.all(
            color: AppColors.borderGrey,
            width: 0.5,
          ),
        ),
        child: Row(
          children: List.generate(
            widget.items.length,
            (index) => Expanded(
              child: _NavBarItemWidget(
                item: widget.items[index],
                isActive: widget.selectedIndex == index,
                onTap: () => widget.onItemTap(index),
                activeColor: widget.selectedColor ?? AppColors.primaryBlue,
                inactiveColor:
                    widget.unselectedColor ?? AppColors.textGrey,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavBarItemWidget extends StatefulWidget {
  final NavBarItem item;
  final bool isActive;
  final VoidCallback onTap;
  final Color activeColor;
  final Color inactiveColor;

  const _NavBarItemWidget({
    required this.item,
    required this.isActive,
    required this.onTap,
    required this.activeColor,
    required this.inactiveColor,
  });

  @override
  State<_NavBarItemWidget> createState() => _NavBarItemWidgetState();
}

class _NavBarItemWidgetState extends State<_NavBarItemWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _animController, curve: Curves.elasticOut),
    );

    _colorAnimation = ColorTween(
      begin: widget.inactiveColor,
      end: widget.activeColor,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeInOut));
  }

  @override
  void didUpdateWidget(_NavBarItemWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      _animController.forward(from: 0.0);
    } else if (!widget.isActive && oldWidget.isActive) {
      _animController.reverse();
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: AnimatedBuilder(
          animation: _colorAnimation,
          builder: (context, child) {
            return Container(
              decoration: BoxDecoration(
                color: widget.isActive
                    ? widget.activeColor.withValues(alpha: 0.1)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(AppSpacing.radiusXL),
              ),
              margin: const EdgeInsets.symmetric(
                vertical: AppSpacing.xs,
                horizontal: AppSpacing.xs,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Stack(
                    alignment: Alignment.topRight,
                    children: [
                      Icon(
                        widget.item.icon,
                        size: 22,
                        color: _colorAnimation.value ?? widget.inactiveColor,
                      ),
                      if (widget.item.showNotification)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.errorRed,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    widget.item.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight:
                          widget.isActive ? FontWeight.w700 : FontWeight.w500,
                      color: _colorAnimation.value ?? widget.inactiveColor,
                    ),
                  ),
                  if (widget.isActive) ...[
                    const SizedBox(height: AppSpacing.xs),
                    ScaleTransition(
                      scale: _scaleAnimation,
                      child: Container(
                        width: 5,
                        height: 5,
                        decoration: BoxDecoration(
                          color: widget.activeColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
