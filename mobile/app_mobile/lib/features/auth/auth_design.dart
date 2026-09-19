import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';

abstract final class AuthPalette {
  static const background = AppColors.background;
  static const forest = AppColors.primaryBlue;
  static const ink = AppColors.ink;
  static const body = AppColors.textBody;
  static const sage = AppColors.surfaceMuted;
  static const border = AppColors.borderGrey;
  static const panel = AppColors.surface;
  static const panelRaised = AppColors.surfaceRaised;
  static const cloud = AppColors.textPrimary;
  static const amber = AppColors.teal;
  static const error = AppColors.errorRed;
}

ThemeData authTheme(BuildContext context) {
  final base = Theme.of(context);
  return base.copyWith(
    scaffoldBackgroundColor: AuthPalette.background,
    textTheme: GoogleFonts.manropeTextTheme(
      base.textTheme,
    ).apply(bodyColor: Colors.white, displayColor: Colors.white),
    colorScheme: base.colorScheme.copyWith(
      primary: AuthPalette.forest,
      surface: AuthPalette.background,
      onSurface: Colors.white,
      error: AuthPalette.error,
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AuthPalette.forest,
        textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AuthPalette.panel,
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 17),
      hintStyle: GoogleFonts.manrope(color: AuthPalette.body, fontSize: 15),
      border: _border(AuthPalette.border),
      enabledBorder: _border(AuthPalette.border),
      focusedBorder: _border(AuthPalette.forest, width: 1.5),
      errorBorder: _border(AuthPalette.error),
      focusedErrorBorder: _border(AuthPalette.error, width: 1.5),
      errorStyle: GoogleFonts.manrope(
        fontSize: 12,
        color: const Color(0xFFFF8F86),
      ),
      suffixIconColor: AuthPalette.body,
    ),
  );
}

OutlineInputBorder _border(Color color, {double width = 1}) =>
    OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: BorderSide(color: color, width: width),
    );

class AuthWordmark extends StatelessWidget {
  final bool centered;
  final bool light;
  const AuthWordmark({super.key, this.centered = false, this.light = false});

  @override
  Widget build(BuildContext context) {
    final color = light ? Colors.white : AuthPalette.forest;
    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'TERRASO',
          style: GoogleFonts.manrope(
            color: color,
            fontSize: 20,
            fontWeight: FontWeight.w800,
            letterSpacing: 5,
          ),
        ),
        const SizedBox(width: 9),
        Icon(Icons.alt_route_rounded, color: color, size: 28),
      ],
    );
    return centered ? Center(child: content) : content;
  }
}

class AuthFieldLabel extends StatelessWidget {
  final String text;
  const AuthFieldLabel(this.text, {super.key});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 7),
    child: Text(
      text.toUpperCase(),
      style: GoogleFonts.manrope(
        color: AuthPalette.body,
        fontSize: 10,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.6,
      ),
    ),
  );
}

class AuthPrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  const AuthPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity,
    height: 58,
    child: FilledButton(
      onPressed: loading ? null : onPressed,
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.fromLTRB(22, 0, 7, 0),
        backgroundColor: AuthPalette.cloud,
        foregroundColor: AuthPalette.ink,
        disabledBackgroundColor: AuthPalette.cloud.withValues(alpha: .55),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
      child: loading
          ? const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AuthPalette.forest,
              ),
            )
          : Row(
              children: [
                Expanded(
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.manrope(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                Container(
                  width: 46,
                  height: 46,
                  decoration: const BoxDecoration(
                    color: AuthPalette.forest,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.arrow_forward_rounded,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              ],
            ),
    ),
  );
}

class AuthErrorBanner extends StatelessWidget {
  final String message;
  const AuthErrorBanner(this.message, {super.key});

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: AuthPalette.error.withValues(alpha: .14),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: AuthPalette.error.withValues(alpha: .35)),
    ),
    child: Text(
      message,
      style: GoogleFonts.manrope(color: const Color(0xFFFFB4AE), fontSize: 13),
    ),
  );
}

