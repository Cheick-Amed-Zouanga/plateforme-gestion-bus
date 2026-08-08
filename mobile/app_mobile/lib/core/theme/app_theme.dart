import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Palette inspirée des maquettes (navy + bleu vif + teal, fond clair).
class AppColors {
  static const Color navy = Color(0xFF1A1348);
  static const Color primaryBlue = Color(0xFF304FFE);
  static const Color teal = Color(0xFF26C2A1);
  static const Color tealSoft = Color(0xFFE6F9F5);
  static const Color yellow = Color(0xFFFFE600);
  static const Color orange = Color(0xFFFF8C00);
  static const Color white = Colors.white;
  static const Color background = Color(0xFFF5F7FA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color textBody = Color(0xFF4B5563);
  static const Color textGrey = Color(0xFF6B7280);
  static const Color borderGrey = Color(0xFFE5E7EB);
  static const Color errorRed = Color(0xFFE11D48);

  /// Alias rétrocompatibles
  static const Color headerDark = navy;
  static const Color backgroundGrey = background;
}

class AppTheme {
  static TextStyle _text([TextStyle? base]) =>
      GoogleFonts.poppins(textStyle: base);

  static ThemeData get theme {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primaryBlue,
        primary: AppColors.primaryBlue,
        secondary: AppColors.teal,
        surface: AppColors.surface,
        error: AppColors.errorRed,
        onPrimary: AppColors.white,
        onSecondary: AppColors.white,
        onSurface: AppColors.navy,
      ),
    );

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.background,
      textTheme: GoogleFonts.poppinsTextTheme(base.textTheme).apply(
        bodyColor: AppColors.textBody,
        displayColor: AppColors.navy,
      ),
      primaryTextTheme: GoogleFonts.poppinsTextTheme(base.primaryTextTheme),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.navy,
        foregroundColor: AppColors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: _text(
          const TextStyle(
            color: AppColors.white,
            fontSize: 20,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
          ),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryBlue,
          foregroundColor: AppColors.white,
          minimumSize: const Size(double.infinity, 52),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: _text(
            const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primaryBlue,
          minimumSize: const Size(double.infinity, 52),
          side: const BorderSide(color: AppColors.primaryBlue, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: _text(
            const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryBlue,
          textStyle: _text(
            const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.borderGrey),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.borderGrey),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.primaryBlue, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.errorRed),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.errorRed, width: 2),
        ),
        labelStyle: _text(const TextStyle(color: AppColors.textGrey)),
        hintStyle: _text(const TextStyle(color: AppColors.textGrey)),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: AppColors.borderGrey),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.tealSoft,
        labelStyle: _text(
          const TextStyle(
            color: AppColors.teal,
            fontWeight: FontWeight.w600,
            fontSize: 12,
          ),
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.borderGrey),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primaryBlue,
      ),
    );
  }
}
