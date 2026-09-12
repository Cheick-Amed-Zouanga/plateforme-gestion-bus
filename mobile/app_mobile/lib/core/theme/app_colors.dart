import 'package:flutter/material.dart';

/// Palette de couleurs de l'application TERRASO
/// Couleurs existantes du projet - réutilisables
class AppColors {
  // Couleurs primaires (existantes)
  static const Color navy = Color(0xFF1A1348);
  static const Color primaryBlue = Color(0xFF304FFE);
  static const Color teal = Color(0xFF26C2A1);

  // Backgrounds
  static const Color background = Color(0xFFF5F7FA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color tealSoft = Color(0xFFE6F9F5);

  // Accents
  static const Color yellow = Color(0xFFFFE600);
  static const Color orange = Color(0xFFFF8C00);

  // Texte
  static const Color textBody = Color(0xFF4B5563);
  static const Color textGrey = Color(0xFF6B7280);
  static const Color textLight = Color(0xFF9CA3AF);
  static const Color white = Colors.white;

  // Borders et dividers
  static const Color borderGrey = Color(0xFFE5E7EB);

  // Statut
  static const Color errorRed = Color(0xFFE11D48);
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Aliases pour rétrocompatibilité
  static const Color headerDark = navy;
  static const Color backgroundGrey = background;
}
