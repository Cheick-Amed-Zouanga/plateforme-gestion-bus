import 'package:flutter/material.dart';

/// Palette de couleurs de l'application TERRASO.
/// Source commune aux écrans d'authentification et au reste de l'application.
class AppColors {
  // Couleurs primaires
  static const Color ink = Color(0xFF1F2430);
  static const Color textPrimary = Color(0xFFF6F7F9);
  static const Color navy = textPrimary; // Alias historique des titres.
  static const Color primaryBlue = Color(0xFFFF8A00); // accent principal (identique à AuthPalette.forest)
  static const Color teal = Color(0xFFFFB443); // accent secondaire (ambre clair)

  // Backgrounds
  static const Color background = Color(0xFF151B24);
  static const Color surface = Color(0xFF202936);
  static const Color surfaceRaised = Color(0xFF293342);
  static const Color surfaceMuted = Color(0xFF252D39);
  static const Color tealSoft = Color(0xFF3B2C20);

  // Accents
  static const Color yellow = Color(0xFFFFC94D);
  static const Color orange = Color(0xFFCC7000); // orange foncé (dégradés, contrastes)

  // Texte
  static const Color textBody = Color(0xFFA8AFBC);
  static const Color textGrey = Color(0xFFA8AFBC);
  static const Color textLight = Color(0xFF929DAD);
  static const Color white = Colors.white;

  // Borders et dividers
  static const Color borderGrey = Color(0xFF35404F);

  // Statut
  static const Color errorRed = Color(0xFFE04B3D);
  static const Color success = Color(0xFF22B573);
  static const Color warning = Color(0xFFFFC107);
  static const Color info = Color(0xFF3B82F6);

  // Aliases pour rétrocompatibilité
  static const Color headerDark = navy;
  static const Color backgroundGrey = background;
}
